import { generateVideo } from './services/videoService.js';
import fs from 'fs';
import path from 'path';

async function run() {
  const scenes = [
    { sceneNumber: 1, localPath: 'outputs/test.jpg', narration: 'Test narration 1' },
    { sceneNumber: 2, localPath: 'outputs/test.jpg', narration: 'Test narration 2' }
  ];
  
  // mock image
  if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');
  fs.writeFileSync('outputs/test.jpg', 'mock_image_data');

  try {
    const res = await generateVideo(scenes, 'test_job_123', { voiceover: 'neutral_ai', music: 'no_music' });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
