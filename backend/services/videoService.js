import { execSync, exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { EdgeTTS } from "@seepine/edge-tts";
import dotenv from "dotenv";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../outputs");

// ── Voice Configuration ───────────────────────────────────────────────────────
// EdgeTTS: Upgraded to newest 2024 neural voices
const VOICE_MAP = {
  deep_male:    "en-US-AndrewNeural",
  warm_female:  "en-US-EmmaNeural",
  neutral_ai:   "en-US-BrianNeural",
  whispery:     "en-US-AnaNeural",
  energetic:    "en-US-RogerNeural",
};

// ElevenLabs voice IDs
const ELEVEN_VOICE_MAP = {
  deep_male:    "ErXwobaYiN019PkySvjV",
  warm_female:  "21m00Tcm4TlvDq8ikWAM",
  neutral_ai:   "cgSgspJ2msm6clMC924v",
  whispery:     "2EiwWnXF2V4jmwHMwuid",
  energetic:    "AZnzlk1XvdvUeBnXmlld",
};

// OpenAI TTS voices
const OPENAI_VOICE_MAP = {
  deep_male:   "onyx",
  warm_female: "nova",
  neutral_ai:  "alloy",
  whispery:    "fable",
  energetic:   "shimmer",
};

// ── Cinematic Music (Pixabay — real tracks, not test samples) ─────────────────
const MUSIC_URLS = {
  epic_cinematic:    "https://cdn.pixabay.com/audio/2023/10/09/audio_7d70b4cc30.mp3",
  uplifting_inspire: "https://cdn.pixabay.com/audio/2023/08/07/audio_bbcb3b15cb.mp3",
  dark_suspense:     "https://cdn.pixabay.com/audio/2022/10/25/audio_99e4a9c7b5.mp3",
  chill_lo_fi:       "https://cdn.pixabay.com/audio/2023/01/23/audio_1a9fc84b41.mp3",
  documentary:       "https://cdn.pixabay.com/audio/2023/06/09/audio_5d5ef3b527.mp3",
};

// ── xfade Transition Types ────────────────────────────────────────────────────
const TRANSITIONS = [
  "fade", "fadeblack", "wipeleft", "wiperight",
  "slideleft", "slideright", "circlecrop", "dissolve",
];

function getTransition(index) {
  return TRANSITIONS[index % TRANSITIONS.length];
}

// ─────────────────────────────────────────────────────────────────────────────

function checkFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    const parsed = parseFloat(stdout.trim());
    return isNaN(parsed) ? 4 : parsed;
  } catch {
    return 4;
  }
}

async function generateSilentAudio(outputPath, durationSeconds) {
  await execAsync(
    `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSeconds} "${outputPath}"`
  );
}

async function downloadMusic(url, outputPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 AI-Video-Generator" },
    });
    if (!res.ok) throw new Error(`Music fetch failed: ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Colab Animation (SVD-XT) ─────────────────────────────────────────────────
async function animateImageColab(imagePath, outputPath) {
  dotenv.config({ override: true });

  const colabUrl = process.env.COLAB_URL;
  if (!colabUrl) throw new Error("COLAB_URL is not set in .env");

  console.log(`  🚀 Sending image to Colab GPU (SVD-XT)...`);

  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("file", blob, "image.jpg");

  const baseUrl = colabUrl.replace(/\/$/, "");

  const startRes = await fetch(`${baseUrl}/animate`, {
    method: "POST",
    body: formData,
    headers: { "Bypass-Tunnel-Reminder": "true" },
  });

  if (!startRes.ok) {
    const text = await startRes.text();
    throw new Error(`Colab Error (${startRes.status}): ${text}`);
  }

  const { job_id } = await startRes.json();
  console.log(`  ⏳ Job [${job_id}] queued. Polling...`);

  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 8;

  while (true) {
    await new Promise((r) => setTimeout(r, 2000)); // 2s poll (was 5s)
    let statusData = null;

    try {
      const statusRes = await fetch(`${baseUrl}/status/${job_id}`, {
        headers: { "Bypass-Tunnel-Reminder": "true" },
      });

      if (!statusRes.ok) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors)
          throw new Error(`Status check failed (${statusRes.status})`);
        continue;
      }

      statusData = await statusRes.json();
      consecutiveErrors = 0;
    } catch (err) {
      consecutiveErrors++;
      if (consecutiveErrors >= maxConsecutiveErrors)
        throw new Error(`Connection lost: ${err.message}`);
      continue;
    }

    if (statusData?.status === "done") {
      console.log(`  ✅ Job [${job_id}] complete!`);
      break;
    }
    if (statusData?.status === "error") {
      throw new Error(`Colab GPU failed for job ${job_id}`);
    }
    if (statusData?.status === "queued") {
      console.log(`  🕐 Job [${job_id}] queued (GPU busy)...`);
    }
    if (statusData?.status === "processing" && statusData?.pct !== undefined) {
      console.log(`  🎞️  Job [${job_id}] denoising: ${statusData.pct}%`);
    }
  }

  const dlRes = await fetch(`${baseUrl}/download/${job_id}`, {
    headers: { "Bypass-Tunnel-Reminder": "true" },
  });
  if (!dlRes.ok) throw new Error("Failed to download animated video");

  const buffer = await dlRes.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`  ✨ Downloaded SVD-XT animation → ${path.basename(outputPath)}`);

  // Cleanup job on Colab to free disk space
  try {
    await fetch(`${baseUrl}/cleanup/${job_id}`, {
      method: "DELETE",
      headers: { "Bypass-Tunnel-Reminder": "true" },
    });
  } catch { /* non-critical */ }
}

// ─── TTS Synthesis ────────────────────────────────────────────────────────────
async function synthesizeSpeech(text, voiceType, audioPath) {
  dotenv.config({ override: true });

  const elevenApiKey = process.env.ELEVENLABS_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // ── ElevenLabs Turbo v2 (Best Quality) ───────────────────────
  if (elevenApiKey) {
    console.log(`    🎙️ ElevenLabs Turbo v2...`);
    const voiceId = ELEVEN_VOICE_MAP[voiceType] || ELEVEN_VOICE_MAP.warm_female;
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: { "xi-api-key": elevenApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2",   // Much more natural than v1
            voice_settings: {
              stability: 0.35,             // Lower = more expressive
              similarity_boost: 0.85,
              style: 0.4,                  // Natural emphasis
              use_speaker_boost: true,     // Clearer, warmer voice
            },
          }),
        }
      );
      if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`);
      fs.writeFileSync(audioPath, Buffer.from(await response.arrayBuffer()));
      return true;
    } catch (err) {
      console.warn(`    ⚠️ ElevenLabs failed:`, err.message);
    }
  }

  // ── OpenAI TTS-HD (Good Quality) ─────────────────────────────
  if (openaiApiKey) {
    console.log(`    🎙️ OpenAI TTS-HD...`);
    const voice = OPENAI_VOICE_MAP[voiceType] || OPENAI_VOICE_MAP.warm_female;
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "tts-1-hd",  // High-definition, less robotic
          input: text,
          voice,
          speed: 0.95,        // Slightly slower = more natural
        }),
      });
      if (!response.ok) throw new Error(`OpenAI TTS error: ${response.status}`);
      fs.writeFileSync(audioPath, Buffer.from(await response.arrayBuffer()));
      return true;
    } catch (err) {
      console.warn(`    ⚠️ OpenAI TTS failed:`, err.message);
    }
  }

  // ── EdgeTTS Free Fallback (2024 Neural Voices) ────────────────
  console.log(`    🎙️ EdgeTTS Neural (Free)...`);
  const edgeVoice = VOICE_MAP[voiceType] || VOICE_MAP.warm_female;
  const ttsService = new EdgeTTS({
    voice: edgeVoice,
    rate:   "-8%",    // Slightly slower = more authoritative
    pitch:  "-5Hz",   // Slightly lower = warmer, less synthetic
    volume: "+10%",   // Louder for better mix with music
  });
  const res = await ttsService.call(text);
  fs.writeFileSync(audioPath, res.data);
  return true;
}

// ─── Cinematic Ken Burns Fallback (when Colab is offline) ────────────────────
async function createCinematicFallback(imagePath, outputPath, duration) {
  const W = 1280, H = 720, FPS = 25;
  const totalFrames = Math.ceil(duration * FPS);

  // Randomised zoom + pan directions for variety
  const directions = [
    [1.0, 1.12,  1,  0],
    [1.12, 1.0, -1,  0],
    [1.0, 1.10,  0,  1],
    [1.08, 1.0,  1, -1],
    [1.0, 1.15, -1,  1],
  ];
  const [zStart, zEnd, pxDir, pyDir] =
    directions[Math.floor(Math.random() * directions.length)];

  const step = ((zEnd - zStart) / totalFrames).toFixed(6);
  const zoompan =
    `zoompan=zoom='min(zoom+${step},${zEnd})':` +
    `x='iw/2-(iw/zoom/2)${pxDir >= 0 ? "+" : "-"}(on/${totalFrames})*20':` +
    `y='ih/2-(ih/zoom/2)${pyDir >= 0 ? "+" : "-"}(on/${totalFrames})*10':` +
    `d=${totalFrames}:fps=${FPS}:s=${W}x${H}`;

  const colorGrade =
    `eq=contrast=1.08:brightness=0.02:saturation=1.15,` +
    `curves=all='0/0 0.08/0.06 0.5/0.5 0.92/0.96 1/1',` +
    `vignette=PI/4,` +
    `noise=alls=4:allf=t+u,` +
    `format=yuv420p`;

  const cmd = [
    `ffmpeg -y`,
    `-loop 1 -i "${imagePath}"`,
    `-vf "${zoompan},${colorGrade}"`,
    `-t ${duration}`,
    `-c:v libx264 -preset fast -crf 20 -an`,
    `"${outputPath}"`,
  ].join(" ");

  await execAsync(cmd, { timeout: 120000 });
}

// ─── Main Video Generator ─────────────────────────────────────────────────────
export async function generateVideo(scenes, jobId, audioSettings = {}) {
  if (!checkFfmpeg()) {
    throw new Error("ffmpeg not installed. Run: brew install ffmpeg");
  }

  const jobDir = path.join(OUTPUT_DIR, jobId);
  if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

  const validScenes = scenes.filter(
    (s) => s.localPath && fs.existsSync(path.join(__dirname, "../", s.localPath))
  );
  if (validScenes.length === 0)
    throw new Error("No valid images available.");

  console.log(`  🎬 Building video from ${validScenes.length} scenes…`);

  const { voiceover = "no_voiceover", music = "no_music" } = audioSettings;
  const useTTS = voiceover !== "no_voiceover";

  const processedScenes = [];

  // ── Phase 1: TTS + Animation per scene ──────────────────────────────────────
  for (let i = 0; i < validScenes.length; i++) {
    const scene = validScenes[i];
    const imagePath = path.join(__dirname, "../", scene.localPath);
    const audioPath = path.join(jobDir, `scene_${i}_audio.mp3`);
    const animPath  = path.join(jobDir, `scene_${i}_anim.mp4`);
    let duration = 4;

    if (useTTS && scene.narration) {
      try {
        console.log(`  🎤 TTS for scene ${i + 1}...`);
        await synthesizeSpeech(scene.narration, voiceover, audioPath);
        const ttsDur = await getAudioDuration(audioPath);
        duration = Math.max(4, ttsDur + 0.8);
      } catch (err) {
        console.error(`  ⚠️ TTS failed scene ${i + 1}:`, err.message);
        await generateSilentAudio(audioPath, duration);
      }
    } else {
      await generateSilentAudio(audioPath, duration);
    }

    try {
      await animateImageColab(imagePath, animPath);
    } catch (err) {
      console.error(`  ⚠️ Colab animation failed scene ${i + 1}:`, err.message);
      console.log(`  📽️ Fallback: Ken Burns cinematic animation...`);
      await createCinematicFallback(imagePath, animPath, duration);
    }

    processedScenes.push({ animPath, audioPath, duration });
  }

  // ── Phase 2: Background Music ────────────────────────────────────────────────
  let musicPath = null;
  if (music !== "no_music" && MUSIC_URLS[music]) {
    const musicDir = path.join(__dirname, "../assets/music");
    if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
    musicPath = path.join(musicDir, `${music}.mp3`);

    if (!fs.existsSync(musicPath)) {
      console.log(`  🎵 Downloading cinematic music: ${music}...`);
      try {
        await downloadMusic(MUSIC_URLS[music], musicPath);
      } catch (err) {
        console.error(`  ⚠️ Music download failed:`, err.message);
        musicPath = null;
      }
    } else {
      console.log(`  🎵 Using cached music: ${music}`);
    }
  }

  // ── Phase 3: FFmpeg Assembly with Transitions ────────────────────────────────
  const FPS = 25;
  const WIDTH = 1280;
  const HEIGHT = 720;
  const TRANSITION_DURATION = 0.5;

  // SVD outputs 14 frames @ 7fps = 2.0s per clip (memory-safe notebook)
  const SVD_CLIP_DURATION = 2.0;

  let inputArgs = "";
  let filterParts = [];

  processedScenes.forEach((scene, i) => {
    inputArgs += `-i "${scene.animPath}" `;
    inputArgs += `-i "${scene.audioPath}" `;

    const vidIdx = i * 2;

    const videoFilter = [
      // Stretch 2.0s SVD clip to match audio duration
      `setpts=(${scene.duration}/${SVD_CLIP_DURATION})*PTS`,
      // Convert 7fps → 25fps by duplicating frames (instant, correct duration)
      // NOTE: minterpolate was REMOVED — it ran at 0.05x speed and produced
      // wrong output durations, causing only the first scene to show in output
      `fps=${FPS}`,
      // Scale + letterbox to target resolution
      `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease`,
      `pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black`,
      `setsar=1`,
      `trim=duration=${scene.duration}`,
      `setpts=PTS-STARTPTS`,
      // Cinematic color grade
      `eq=contrast=1.06:brightness=0.015:saturation=1.12:gamma=0.97`,
      // S-curve for filmic look
      `curves=all='0/0 0.1/0.08 0.5/0.5 0.9/0.92 1/1'`,
      // Vignette + subtle grain
      `vignette=PI/5`,
      `noise=alls=3:allf=t+u`,
      `format=yuv420p`,
    ].join(",");

    filterParts.push(`[${vidIdx}:v]${videoFilter}[pv${i}]`);
  });

  // Build xfade transition chain
  if (processedScenes.length === 1) {
    filterParts.push(`[pv0]copy[outv]`);
    filterParts.push(`[1:a]acopy[outa]`);
  } else {
    let prevLabel = "pv0";
    let cumOffset = 0;

    for (let i = 0; i < processedScenes.length - 1; i++) {
      const nextLabel  = `pv${i + 1}`;
      const outLabel   = `xv${i + 1}`;
      const transition = getTransition(i);
      cumOffset += processedScenes[i].duration - TRANSITION_DURATION;
      filterParts.push(
        `[${prevLabel}][${nextLabel}]xfade=transition=${transition}:duration=${TRANSITION_DURATION}:offset=${Math.max(0.1, cumOffset)}[${outLabel}]`
      );
      prevLabel = outLabel;
    }
    filterParts.push(`[${prevLabel}]copy[outv]`);

    // Audio concat with fade in/out
    const totalDur = processedScenes.reduce((s, sc) => s + sc.duration, 0);
    const audioInputs = processedScenes.map((_, i) => `[${i * 2 + 1}:a]`).join("");
    filterParts.push(
      `${audioInputs}concat=n=${processedScenes.length}:v=0:a=1[outa_raw]`,
      `[outa_raw]afade=t=in:st=0:d=0.3,afade=t=out:st=${totalDur - 0.5}:d=0.5[outa]`
    );
  }

  let filterComplex = filterParts.join("; ");
  let mapArgs = `-map "[outv]" -map "[outa]"`;

  // ── Background Music with Sidechain Ducking ────────────────────────────────
  if (musicPath) {
    const bgmIdx = processedScenes.length * 2;
    const totalDur = processedScenes.reduce((s, sc) => s + sc.duration, 0);
    inputArgs += `-i "${musicPath}" `;
    filterComplex +=
      `; [outa]asplit=2[vo1][vo2]` +
      `; [${bgmIdx}:a]volume=0.12,afade=t=in:st=0:d=2,afade=t=out:st=${totalDur - 3}:d=3[bgmfade]` +
      `; [bgmfade][vo1]sidechaincompress=threshold=0.08:ratio=8:attack=100:release=600[duckedbgm]` +
      `; [vo2][duckedbgm]amix=inputs=2:duration=first:dropout_transition=2[finala]`;
    mapArgs = `-map "[outv]" -map "[finala]"`;
  }

  const outputPath = path.join(jobDir, "output.mp4");
  const totalDuration = processedScenes.reduce((s, sc) => s + sc.duration, 0);

  const cmd = [
    `ffmpeg -y`,
    inputArgs.trim(),
    `-filter_complex "${filterComplex}"`,
    mapArgs,
    `-c:v libx264 -preset slow -crf 18`,
    `-c:a aac -b:a 192k -ar 44100`,
    `-t ${totalDuration}`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(" ");

  console.log("  🔧 FFmpeg: assembling scenes with transitions...");

  try {
    const { stderr } = await execAsync(cmd, { timeout: 600000 });
    if (stderr && stderr.toLowerCase().includes("error")) {
      console.log("  ffmpeg stderr:", stderr.slice(-500));
    }
  } catch (err) {
    console.error("  ❌ FFmpeg error:", err.message);
    // Simple fallback without transitions
    await simpleConcatFallback(processedScenes, outputPath, totalDuration, musicPath);
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error("FFmpeg completed but output file was not created.");
  }

  const videoRelPath = `outputs/${jobId}/output.mp4`;
  console.log(`  ✅ Video saved → ${videoRelPath}`);
  return `/${videoRelPath}`;
}

// ── Simple Concat Fallback (no transitions) ───────────────────────────────────
async function simpleConcatFallback(processedScenes, outputPath, totalDuration, musicPath) {
  const FPS = 25, W = 1280, H = 720;
  const SVD_CLIP_DURATION = 2.0;
  let inputArgs = "", filterParts = [], concatInputs = "";

  processedScenes.forEach((scene, i) => {
    inputArgs += `-i "${scene.animPath}" -i "${scene.audioPath}" `;
    const vi = i * 2, ai = i * 2 + 1;
    filterParts.push(
      `[${vi}:v]setpts=(${scene.duration}/${SVD_CLIP_DURATION})*PTS,` +
      `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
      `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,` +
      `trim=duration=${scene.duration},format=yuv420p[v${i}]`
    );
    concatInputs += `[v${i}][${ai}:a]`;
  });

  let fc = filterParts.join("; ") +
    `; ${concatInputs}concat=n=${processedScenes.length}:v=1:a=1[outv][outa]`;
  let ma = `-map "[outv]" -map "[outa]"`;

  if (musicPath) {
    const bi = processedScenes.length * 2;
    inputArgs += `-i "${musicPath}" `;
    fc += `; [outa]asplit=2[vo1][vo2]; [${bi}:a]volume=0.12[bgm];` +
          `[bgm][vo1]sidechaincompress=threshold=0.1:ratio=6:attack=150:release=700[db];` +
          `[vo2][db]amix=inputs=2:duration=first[finala]`;
    ma = `-map "[outv]" -map "[finala]"`;
  }

  const cmd = `ffmpeg -y ${inputArgs} -filter_complex "${fc}" ${ma} -c:v libx264 -preset ultrafast -crf 22 -c:a aac -b:a 128k -t ${totalDuration} -movflags +faststart "${outputPath}"`;
  await execAsync(cmd, { timeout: 300000 });
}