# 🎬 ANIMaiTOR: Core Models & Algorithms (Presenter Guide)

This notepad contains the precise explanation of every **AI Model**, its **Mathematical Algorithm**, and **How it works under the hood** in simple, plain English. Use this guide to explain the project to others with confidence.

---

## 🧠 Model 1: The Scriptwriter (Story Boarding)

* **Active Models:** `Qwen-2.5-72B`, `Gemini-2.5-Flash`, and `LLaMA-3.3-70B`.
* **Under-the-Hood Algorithm:** **Autoregressive Token Prediction (Transformer Architecture)**.

### How it works:
1. **Attention Mechanism:** The model reads your simple text prompt and generates words one-by-one (tokens). It uses **Self-Attention** to look back at all previous words to ensure the story flows logically.
2. **Cascading Retry Logic:** If the main API fails or experiences high latency, a **fallback algorithm** instantly retries with the next model in line, landing finally on a local offline template database.
3. **Structured Constraints:** The model is mathematically steered to output raw JSON format containing structured scene visuals and spoken narration.

---

## 📸 Model 2: The Scenery Photographer (Visuals)

* **Active Models:** `Flux.1` (Black Forest Labs) and `Turbo`.
* **Under-the-Hood Algorithm:** **Flow Matching & Latent Diffusion**.

### How it works:
1. **Denoising Process:** The model starts with a screen of **pure mathematical noise (television static)**.
2. **Conditioning:** By reading the visual description from the Director, the algorithm calculates step-by-step over 20-30 iterations how to subtract and guide that noise until a sharp, high-definition image emerges.
3. **Style Wrapping Filter:** The system wraps all inputs in a **prompt template** (`Pixar Disney style, 3D CGI animation, consistent main character`) to force visual uniformity across all 5 scenes.

---

## 🎙️ Model 3: The Voice Actor (Narration & Audio)

* **Active Models:** `ElevenLabs Turbo v2`, `OpenAI TTS-1-HD`, and `EdgeTTS Neural`.
* **Under-the-Hood Algorithm:** **Neural Vocoder Waveform Synthesizers**.

### How it works:
1. **Phonetic Conversion:** Converts standard written text letters into phonemes (the acoustic sounds of syllables).
2. **Waveform Synthesis:** A deep neural vocoder predicts the exact frequency waves, pitch, and speech rates to output human voice files at **44,100Hz**, complete with natural breath pauses.
3. **FFmpeg Sidechain Compression (Audio Ducking):** 
   - Continuously monitors the voiceover track's decibel waves.
   - When speech is detected, the compressor **automatically divides background music volume down to 12%**.
   - During pauses in narration, the compressor releases, letting the music swell back up to fill the silence.

---

## 🎞️ Model 4: The Animator (Motion)

* **Active Model:** `Stable Video Diffusion (SVD-XT)`.
* **Under-the-Hood Algorithm:** **Temporal Latent Diffusion (3D UNet)**.

### How it works:
1. **Temporal Layers:** SVD-XT is a model trained on millions of video clips. It understands real-world physics, gravity, and camera movements.
2. **Frame Prediction:** It takes the 2D image from Step 2 as a starting reference frame and predicts a series of **14 fluidly moving frames** at 7 frames per second (generating a 2.0-second clip).
3. **VRAM Memory-Safe Offloading:**
   - *Problem:* Running SVD requires over 8GB of GPU VRAM, which instantly crashes cheap or free servers.
   - *Solution:* **Sequential CPU Offloading** loads only the active execution layer of the model to the GPU at any single millisecond, reducing RAM usage to **1.5GB**.

---

## ✂️ Model 5: The Post-Production Editor (Compilation)

* **Active Engine:** `FFmpeg`.
* **Under-the-Hood Algorithms:**
  1. **Speed Interpolation (`setpts`):** Stretches the frame timing of the 2-second animation clip so it is slowed down to match the exact duration of the spoken voiceover track.
  2. **Cross-Fade Transitions (`xfade`):** Blends consecutive scene boundaries by applying a mathematical opacity gradient overlay between overlapping segments over a $0.5\text{-second}$ window.
  3. **FastStart Encoding:** Packs the video stream using the H.264 codec (`libx264`) and shifts file metadata to the front (`+faststart`) so the video streams instantly on mobile or desktop browsers.

---
*ANIMaiTOR Project Reference Guide - Deep Model & Algorithm Edition*
