import express from "express";
import { generateScripts } from "../services/geminiService.js";

const router = express.Router();

/**
 * POST /api/script/generate
 * Body: { prompt: string }
 * Returns: { scripts: [...] }
 */
router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "A non-empty prompt is required." });
    }

    if (prompt.trim().length > 500) {
      return res.status(400).json({ error: "Prompt must be under 500 characters." });
    }

    console.log(`📝 Generating scripts for prompt: "${prompt.trim()}"`);
    const result = await generateScripts(prompt.trim());

    return res.json(result);
  } catch (err) {
    console.error("Script generation route error:", err);
    return res.status(500).json({ error: "Failed to generate scripts.", message: err.message });
  }
});

export default router;
