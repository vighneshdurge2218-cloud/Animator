import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../outputs");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateImageBuffer(prompt, sceneNumber, retries = 2) {
  const seed = Math.floor(Math.random() * 1000000);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use flux first, then turbo
      const model = attempt === 1 ? 'flux' : 'turbo';
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=576&seed=${seed}&nologo=true&model=${model}`;
      
      // Massive 60 second timeout because free GPU clusters can be slow under heavy load
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      console.log(`[Scene ${sceneNumber}] Fetching image... (Attempt ${attempt}/${retries} with ${model})`);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429 && attempt < retries) {
          console.warn(`[Scene ${sceneNumber}] Rate limited (429). Waiting 5 seconds before retry...`);
          await sleep(5000);
          continue; 
        }
        throw new Error(`Pollinations API error: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (attempt < retries) {
        console.warn(`[Scene ${sceneNumber}] Failed (${error.message}). Retrying...`);
        await sleep(5000);
        continue;
      }
      
      console.error(`All attempts failed for scene ${sceneNumber}: ${error.message}`);
      return null; 
    }
  }
}

export async function generateSceneImages(scenes = [], jobId = null, scriptTitle = "", scriptStyle = "") {
  console.log(`Starting sequential image generation for ${scenes.length} scenes...`);
  
  const results = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const basePrompt = scene?.visualPrompt || "cinematic scene";
    
    // Highly refined prompt for professional 3D animation with a character
    const enhancedPrompt = `${scriptStyle} style, high-end 3D animation film still, Pixar Disney style, Unreal Engine 5 render. ${scriptTitle}: ${basePrompt}. Featuring a consistent main character protagonist in the shot. Masterpiece, highly detailed, vibrant colors, dramatic cinematic lighting, 8k resolution.`;

    try {
      console.log(`Requesting image for scene ${i + 1}...`);
      const buffer = await generateImageBuffer(enhancedPrompt, i + 1);

      if (!buffer) {
        console.error(`Skipping scene ${i + 1} due to generation failure.`);
        continue;
      }

      const filename = `scene_${Date.now()}_${i}.jpg`;
      const filepath = path.join(OUTPUT_DIR, filename);

      fs.writeFileSync(filepath, buffer);
      console.log(`Finished image for scene ${i + 1}`);

      results.push({
        sceneNumber: scene.sceneNumber || i + 1,
        imageUrl: buildImageUrl(filename),
      });

      // Brief wait between requests to avoid rate limits
      await sleep(3000);
    } catch (err) {
      console.error(`Image generation failed for scene ${i + 1}:`, err.message);
    }
  }

  return results;
}

export async function regenerateSingleImage(scene, jobId, scriptTitle = "", scriptStyle = "") {
  const basePrompt = scene?.visualPrompt || "cinematic scene";
  
  // Apply the same highly refined prompt logic for regeneration
  const enhancedPrompt = `${scriptStyle} style, high-end 3D animation film still, Pixar Disney style, Unreal Engine 5 render. ${scriptTitle}: ${basePrompt}. Featuring a consistent main character protagonist in the shot. Masterpiece, highly detailed, vibrant colors, dramatic cinematic lighting, 8k resolution.`;
  
  const buffer = await generateImageBuffer(enhancedPrompt, scene.sceneNumber);

  if (!buffer) {
    throw new Error("Failed to regenerate image.");
  }

  const filename = `regen_${Date.now()}.jpg`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  return {
    sceneNumber: scene.sceneNumber,
    imageUrl: buildImageUrl(filename),
  };
}

export function buildImageUrl(filename) {
  const PORT = process.env.PORT || 5002;
  return `http://localhost:${PORT}/outputs/${filename}`;
}
