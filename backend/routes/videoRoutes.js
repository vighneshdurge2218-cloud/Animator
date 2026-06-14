import express from "express";
import { generateVideo } from "../services/videoService.js";

const router = express.Router();

/**
 * POST /api/video/generate
 * Body: { jobId: string, scenes: [{ sceneNumber, localPath, narration }], audioSettings: { music, voiceover } }
 * Returns: { videoUrl: string }
 */
router.post("/generate", async (req, res) => {
  try {
    const { jobId, scenes, audioSettings } = req.body;

    if (!jobId || typeof jobId !== "string") {
      return res.status(400).json({ error: "jobId is required." });
    }

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ error: "scenes array is required and must not be empty." });
    }

    console.log(`🎬 Generating video for job ${jobId} with ${scenes.length} scenes`);
    console.log(`🎵 Audio Settings:`, audioSettings);

    const videoUrl = await generateVideo(scenes, jobId, audioSettings);

    return res.json({ videoUrl });
  } catch (err) {
    console.error("Video generation route error:", err);
    return res.status(500).json({ error: "Failed to generate video.", message: err.message });
  }
});

export default router;