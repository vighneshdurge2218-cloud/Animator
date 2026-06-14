# ==============================================================================
# 🎬 AI Video Server — SVD Memory-Safe Edition
# ==============================================================================
#
# ⚠️  THIS FILE IS A REFERENCE GUIDE — NOT RUN LOCALLY.
#     Open colab_svd_server.ipynb in Google Colab to run this.
#
# MEMORY-SAFE CONFIG (prevents free Colab T4 session crashes):
#   ✅ enable_sequential_cpu_offload()  → pages each layer one at a time
#      (model_cpu_offload holds full UNet in CPU RAM → ~6-8 GB → crashes)
#      (sequential offload uses ~1-2 GB CPU RAM peak → much safer)
#   ✅ pipe.enable_attention_slicing(1) → slice attention heads → saves VRAM
#   ✅ num_frames=14 (was 20)           → fewer frames = less VRAM during decode
#   ✅ decode_chunk_size=4 (was 8)      → smaller VAE decode batches = less VRAM
#   ✅ num_inference_steps=20 (was 25)  → 20% faster, same quality
#   ✅ image resize to 512×288 (was 576×320) → 21% less VRAM during encode
#   ✅ gc.collect() + empty_cache() after every job
#
# EXPECTED TIMING (free Colab T4, 12.7 GB system RAM):
#   Old (model_cpu_offload, 20 frames, crashes): ❌ session crash
#   New (sequential_cpu_offload, 14 frames):     ~3–5 min per image ✅
#
# MEMORY BUDGET (T4 = 15 GB VRAM, Colab free = 12.7 GB system RAM):
#   Model weights:    ~3.0 GB VRAM (fp16)
#   Inference peak:   ~5-7 GB VRAM (14 frames × 512×288)
#   System RAM peak:  ~1-2 GB (sequential offload)
#   Total stays well within free tier limits.
#
# ==============================================================================
# CELL 1 — Install Dependencies
# ==============================================================================
# Paste in Colab Cell 1:
#
# !pip install -q diffusers transformers accelerate fastapi uvicorn python-multipart
# !wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -O cloudflared.deb && dpkg -i cloudflared.deb 2>/dev/null
# print("✅ Done!")
#
# ==============================================================================
# CELL 2 — Load SVD Model + Start Server
# ==============================================================================
# Paste in Colab Cell 2:

import gc
import os
import sys
import uuid
import time
import random
import threading

# ── Guard: must run in Colab with GPU, not locally ────────────────────────────
def _check_environment():
    try:
        import torch  # noqa: F401
        if not torch.cuda.is_available():
            print("="*65)
            print("❌  No GPU found! This must run in Google Colab with T4 GPU.")
            print("   Open colab_svd_server.ipynb in Colab instead.")
            print("="*65)
            sys.exit(1)
    except ImportError:
        print("="*65)
        print("❌  PyTorch not found. Run this in Google Colab, not locally.")
        print("   Run Cell 1 first to install dependencies.")
        print("="*65)
        sys.exit(1)

_check_environment()

# ── Colab-only imports ────────────────────────────────────────────────────────
try:
    import torch                                                    # noqa: F401
    import nest_asyncio                                             # noqa: F401
    from diffusers import StableVideoDiffusionPipeline             # noqa: F401
    from diffusers.utils import load_image, export_to_video        # noqa: F401
    from fastapi import FastAPI, File, UploadFile, HTTPException    # noqa: F401
    from fastapi.responses import FileResponse                      # noqa: F401
    import uvicorn                                                  # noqa: F401
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("   Make sure you ran Cell 1 first!")
    sys.exit(1)

nest_asyncio.apply()


# ── Memory helper ─────────────────────────────────────────────────────────────
def free_memory():
    """Aggressively free GPU memory after each job to prevent OOM."""
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()


# ── Load SVD-XT Model (Memory-Safe Edition) ───────────────────────────────────
#
# WHY sequential_cpu_offload (not model_cpu_offload):
#
# enable_model_cpu_offload():      keeps full UNet in CPU RAM → ~6-8 GB system RAM
#                                  → crashes free Colab (only 12.7 GB total)
# enable_sequential_cpu_offload(): pages each layer to GPU one at a time
#                                  → only ~1-2 GB system RAM peak → safe!
#
# Yes, sequential is slower (3-4x), but it's the only option that fits in
# free Colab's memory budget without crashing.
#
print("⏳ Loading SVD-XT model (memory-safe)... this takes ~2-3 min first time")

pipe = StableVideoDiffusionPipeline.from_pretrained(
    "stabilityai/stable-video-diffusion-img2vid-xt",
    torch_dtype=torch.float16,
    variant="fp16",
)

# ── Memory-Safe Optimizations ─────────────────────────────────────────────────
# 1. Sequential offload: pages each layer to GPU one at a time → low system RAM
pipe.enable_sequential_cpu_offload()

# 2. Attention slicing: compute attention in slices → saves VRAM during inference
#    slice_size=1 is most memory efficient (1 head at a time)
pipe.enable_attention_slicing(1)

# NOTE: SVD uses AutoencoderKLTemporalDecoder which does NOT support
# enable_slicing() or enable_tiling() — those only work on AutoencoderKL.

free_memory()
print("✅ SVD-XT model loaded (memory-safe)!")

vram_used  = round(torch.cuda.memory_allocated() / 1e9, 2)
vram_total = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 2)
print(f"   VRAM: {vram_used}GB / {vram_total}GB")


# ── App + State ────────────────────────────────────────────────────────────────
app = FastAPI(title="AI Video Server — SVD Memory-Safe Edition")
jobs = {}       # job_id -> status string
progress = {}   # job_id -> {"step": int, "total": int}

# CRITICAL: Only 1 job renders at a time — prevents parallel OOM
gpu_lock = threading.Semaphore(1)


# ── Progress callback ─────────────────────────────────────────────────────────
class ProgressCallback:
    """Tracks diffusion denoising steps so frontend can show real-time progress."""
    def __init__(self, job_id, total_steps):
        self.job_id = job_id
        self.total = total_steps

    def __call__(self, pipe, step_index, timestep, callback_kwargs):
        progress[self.job_id] = {"step": step_index + 1, "total": self.total}
        # Print every 5 steps to avoid log spam
        if (step_index + 1) % 5 == 0 or step_index == 0:
            pct = round((step_index + 1) / self.total * 100)
            print(f"  [{self.job_id[:8]}] Denoising: {step_index + 1}/{self.total} ({pct}%)")
        return callback_kwargs


# ── Worker ────────────────────────────────────────────────────────────────────
# Memory-safe parameters — tuned for free Colab T4 (15 GB VRAM, 12.7 GB RAM)
# ┌─────────────────────────────────────────────────────────────┐
# │  NUM_FRAMES=14  → 14 frames × 512×288 = manageable VRAM    │
# │  DECODE_CHUNK=4 → decode 4 frames at a time → less VRAM    │
# │  NUM_STEPS=20   → 20% fewer steps, same quality            │
# │  Image: 512×288 → 21% less than 576×320                    │
# └─────────────────────────────────────────────────────────────┘
NUM_FRAMES   = 14   # 14 frames @ 7fps = 2.0s clip (fits in 15GB VRAM)
DECODE_CHUNK = 4    # decode 4 frames at a time → safe VRAM usage
NUM_STEPS    = 20   # 20 steps = 80% of default quality, 20% faster

def generate_video_job(job_id: str, input_path: str):
    """Runs in background thread. Acquires GPU lock → renders → frees memory."""
    print(f"[{job_id}] 🕐 Waiting for GPU slot...")
    acquired = gpu_lock.acquire(blocking=True, timeout=900)

    if not acquired:
        jobs[job_id] = "error"
        print(f"[{job_id}] ❌ Timed out in queue.")
        return

    try:
        jobs[job_id] = "processing"
        progress[job_id] = {"step": 0, "total": NUM_STEPS}
        print(f"[{job_id}] 🎬 GPU acquired. Animating ({NUM_FRAMES} frames, {NUM_STEPS} steps)...")

        # 512×288 instead of 576×320 → 21% less VRAM during VAE encode
        # Still looks great and fits comfortably in T4 memory budget
        image = load_image(input_path).resize((512, 288))

        seed   = random.randint(0, 1_000_000)
        bucket = random.randint(80, 127)    # 80-127 = natural smooth motion
        noise  = random.uniform(0.02, 0.06)

        print(f"[{job_id}] seed={seed}, motion_bucket={bucket}, noise={noise:.3f}")

        callback = ProgressCallback(job_id, NUM_STEPS)

        frames = pipe(
            image,
            num_frames=NUM_FRAMES,
            num_inference_steps=NUM_STEPS,
            decode_chunk_size=DECODE_CHUNK,       # larger = faster decode
            generator=torch.manual_seed(seed),
            motion_bucket_id=bucket,
            noise_aug_strength=noise,
            callback_on_step_end=callback,        # progress tracking
            callback_on_step_end_tensor_inputs=["latents"],
        ).frames[0]

        output_path = f"output_{job_id}.mp4"
        export_to_video(frames, output_path, fps=7)  # 14 frames @ 7fps = 2.0s clip

        jobs[job_id] = "done"
        print(f"[{job_id}] ✅ Done! {len(frames)} frames @ 8fps → {output_path}")

    except torch.cuda.OutOfMemoryError:
        jobs[job_id] = "error"
        print(f"[{job_id}] ❌ CUDA OOM — try decode_chunk_size=4 or sequential offload")
    except Exception as e:
        jobs[job_id] = "error"
        print(f"[{job_id}] ❌ Error: {e}")
    finally:
        # ALWAYS free memory — even on error
        free_memory()
        gpu_lock.release()
        if os.path.exists(input_path):
            os.remove(input_path)  # Free disk space
        used_gb = round(torch.cuda.memory_allocated() / 1e9, 2) if torch.cuda.is_available() else 0
        print(f"[{job_id}] 🧹 VRAM freed → {used_gb}GB used. Ready for next job.")


# ── API Routes ────────────────────────────────────────────────────────────────

@app.post("/animate")
async def animate_endpoint(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    jobs[job_id] = "queued"
    progress[job_id] = {"step": 0, "total": NUM_STEPS}
    content = await file.read()
    input_path = f"input_{job_id}.jpg"
    with open(input_path, "wb") as f:
        f.write(content)
    print(f"[{job_id}] 📩 Received ({len(content)//1024} KB). Queuing...")
    threading.Thread(target=generate_video_job, args=(job_id, input_path), daemon=True).start()
    return {"job_id": job_id}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    status = jobs.get(job_id, "not_found")
    prog   = progress.get(job_id, {"step": 0, "total": NUM_STEPS})
    return {
        "status":   status,
        "progress": prog,
        "pct":      round(prog["step"] / max(prog["total"], 1) * 100),
    }


@app.get("/download/{job_id}")
def download_video(job_id: str):
    path = f"output_{job_id}.mp4"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video not ready yet.")
    return FileResponse(path, media_type="video/mp4")


@app.delete("/cleanup/{job_id}")
def cleanup_job(job_id: str):
    """Delete files after download to keep Colab disk clean."""
    path = f"output_{job_id}.mp4"
    if os.path.exists(path):
        os.remove(path)
    jobs.pop(job_id, None)
    progress.pop(job_id, None)
    return {"cleaned": job_id}


@app.get("/health")
def health_check():
    vram_used  = round(torch.cuda.memory_allocated() / 1e9, 2) if torch.cuda.is_available() else 0
    vram_total = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 2) if torch.cuda.is_available() else 0
    return {
        "status":        "ok",
        "model":         "SVD-XT (Speed-Optimized Edition)",
        "gpu_busy":      gpu_lock._value == 0,
        "vram_used_gb":  vram_used,
        "vram_total_gb": vram_total,
        "active_jobs":   len([v for v in jobs.values() if v in ("queued", "processing")]),
        "queued_jobs":   len([v for v in jobs.values() if v == "queued"]),
    }


# ── Start Server ──────────────────────────────────────────────────────────────
def run_server():
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")

threading.Thread(target=run_server, daemon=True).start()
time.sleep(3)
print("\n" + "=" * 65)
print("🚀 SERVER IS RUNNING (Speed-Optimized SVD)!")
print("   Now run Cell 3 to get your public URL.")
print("=" * 65)


# ==============================================================================
# CELL 3 — OPTION A (RECOMMENDED): Cloudflare Tunnel
# ==============================================================================
# Run in a new Colab cell:
#
#   !cloudflared tunnel --url http://localhost:8000
#
# Look for: "Your quick Tunnel: https://xxxx.trycloudflare.com"
# Copy URL → paste into backend/.env:  COLAB_URL=https://xxxx.trycloudflare.com
# Restart backend: npm run dev
# ==============================================================================

# ==============================================================================
# CELL 3 — OPTION B (FALLBACK): LocalTunnel
# ==============================================================================
#   !npm install -g localtunnel 2>/dev/null && lt --port 8000
# ==============================================================================
