import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  generateSceneImages,
  regenerateSingleImage,
} from "../services/imageService.js";

const router = express.Router();

/** POST /api/image/generate */
router.post("/generate", async (req, res) => {
  try {
    const { scenes, jobId: existingJobId, scriptTitle, scriptStyle } = req.body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ error: "scenes array is required." });
    }

    const jobId = existingJobId || uuidv4();
    console.log(`🖼️  Generating ${scenes.length} images for job ${jobId}`);
    console.log(`    Script: "${scriptTitle}" | Style: "${scriptStyle}"`);

    const images = await generateSceneImages(scenes, jobId, scriptTitle, scriptStyle);
    return res.json({ jobId, images });
  } catch (err) {
    console.error("Image generate error:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate images.", message: err.message });
  }
});

/** POST /api/image/regenerate — regenerate a single scene */
router.post("/regenerate", async (req, res) => {
  try {
    const { scene, jobId, scriptTitle, scriptStyle } = req.body;

    if (!scene || !jobId) {
      return res.status(400).json({ error: "scene and jobId are required." });
    }

    console.log(`🔄 Regenerating scene ${scene.sceneNumber} for job ${jobId}`);
    const result = await regenerateSingleImage(scene, jobId, scriptTitle, scriptStyle);
    return res.json(result);
  } catch (err) {
    console.error("Image regen error:", err);
    return res
      .status(500)
      .json({ error: "Failed to regenerate image.", message: err.message });
  }
});

export default router;