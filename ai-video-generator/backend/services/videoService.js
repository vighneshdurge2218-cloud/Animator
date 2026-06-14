import { execSync, exec } from "child_process";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { EdgeTTS } from "@seepine/edge-tts";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../outputs");

const VOICE_MAP = {
  deep_male: "en-US-ChristopherNeural",
  warm_female: "en-US-AriaNeural",
  neutral_ai: "en-US-GuyNeural",
  whispery: "en-US-JennyNeural",
  energetic: "en-US-EricNeural",
};

const MUSIC_URLS = {
  epic_cinematic: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  uplifting_inspire: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  dark_suspense: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  chill_lo_fi: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  documentary: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
};

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
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
    return parseFloat(stdout.trim());
  } catch (err) {
    console.error(`Failed to probe duration for ${filePath}:`, err.message);
    return 4; // fallback
  }
}

async function generateSilentAudio(outputPath, durationSeconds) {
  await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${durationSeconds} "${outputPath}"`);
}

async function downloadMusic(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch music: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

export async function generateVideo(scenes, jobId, audioSettings = {}) {
  if (!checkFfmpeg()) {
    throw new Error("ffmpeg is not installed. Run: brew install ffmpeg");
  }

  const jobDir = path.join(OUTPUT_DIR, jobId);
  if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });

  const validScenes = scenes.filter((s) => s.localPath && fs.existsSync(path.join(__dirname, "../", s.localPath)));
  if (validScenes.length === 0) throw new Error("No valid images available for video generation.");

  console.log(`  🎬 Building video from ${validScenes.length} scenes…`);

  const { voiceover = "no_voiceover", music = "no_music" } = audioSettings;
  const useTTS = voiceover !== "no_voiceover";
  const edgeVoice = VOICE_MAP[voiceover] || VOICE_MAP.warm_female;

  let ttsService = null;
  if (useTTS) {
    ttsService = new EdgeTTS({ voice: edgeVoice });
  }

  const processedScenes = [];

  // 1. Generate Audio & Calculate Durations
  for (let i = 0; i < validScenes.length; i++) {
    const scene = validScenes[i];
    const imagePath = path.join(__dirname, "../", scene.localPath);
    const audioPath = path.join(jobDir, `scene_${i}_audio.mp3`);
    let duration = 4; // default 4 seconds

    if (useTTS && scene.narration) {
      try {
        console.log(`  🎤 Generating TTS for scene ${i + 1}...`);
        const res = await ttsService.call(scene.narration);
        fs.writeFileSync(audioPath, res.data);
        const ttsDuration = await getAudioDuration(audioPath);
        duration = Math.max(3, ttsDuration + 0.5); // Pad by 0.5s
      } catch (err) {
        console.error(`  ⚠️ TTS failed for scene ${i + 1}:`, err.message);
        await generateSilentAudio(audioPath, duration);
      }
    } else {
      await generateSilentAudio(audioPath, duration);
    }

    processedScenes.push({ imagePath, audioPath, duration });
  }

  // 2. Download Background Music
  let musicPath = null;
  if (music !== "no_music" && MUSIC_URLS[music]) {
    console.log(`  🎵 Downloading background music...`);
    musicPath = path.join(jobDir, "bgm.mp3");
    try {
      await downloadMusic(MUSIC_URLS[music], musicPath);
    } catch (err) {
      console.error(`  ⚠️ Background music download failed:`, err.message);
      musicPath = null; // Proceed without music
    }
  }

  const FPS = 24;
  const WIDTH = 1280;
  const HEIGHT = 720;

  // 3. Build FFmpeg Command
  let inputArgs = "";
  let filterParts = [];
  let concatInputs = "";

  processedScenes.forEach((scene, i) => {
    const frames = Math.ceil(scene.duration * FPS);
    inputArgs += `-loop 1 -t ${scene.duration} -i "${scene.imagePath}" `;
    inputArgs += `-i "${scene.audioPath}" `;

    const imgIndex = i * 2;
    const audIndex = i * 2 + 1;

    filterParts.push(
      `[${imgIndex}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,` +
      `pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2,` +
      `setsar=1,` +
      `zoompan=z='min(zoom+0.0008,1.05)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${WIDTH}x${HEIGHT}:fps=${FPS},` +
      `format=yuv420p[v${i}]`
    );

    concatInputs += `[v${i}][${audIndex}:a]`;
  });

  let filterComplex = filterParts.join("; ") + `; ${concatInputs}concat=n=${processedScenes.length}:v=1:a=1[outv][outa]`;
  let mapArgs = `-map "[outv]" -map "[outa]"`;

  // Mix Background Music
  if (musicPath) {
    const bgmIndex = processedScenes.length * 2;
    inputArgs += `-i "${musicPath}" `;
    filterComplex += `; [${bgmIndex}:a]volume=0.1[bgm]; [outa][bgm]amix=inputs=2:duration=first:dropout_transition=2[finala]`;
    mapArgs = `-map "[outv]" -map "[finala]"`;
  }

  const outputPath = path.join(jobDir, "output.mp4");

  const cmd = `ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" ${mapArgs} -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

  console.log("  🔧 Running ffmpeg to assemble Video + Audio...");

  try {
    const { stderr } = await execAsync(cmd, { timeout: 300000 });
    if (stderr && stderr.toLowerCase().includes("error")) {
      console.log("  ffmpeg stderr:", stderr.slice(-500));
    }
  } catch (err) {
    console.error("  ffmpeg error:", err.message);
    throw new Error(`Video rendering failed: ${err.message}`);
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error("ffmpeg completed but output file was not created.");
  }

  const videoRelPath = `outputs/${jobId}/output.mp4`;
  console.log(`  ✅ Video saved → ${videoRelPath}`);
  return `/${videoRelPath}`;
}