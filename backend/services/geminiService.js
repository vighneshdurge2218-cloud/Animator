import fetch from 'node-fetch';
import { getFallbackScripts } from '../utils/fallbackScripts.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Generate 3 short-form video scripts using OpenRouter's free LLaMA 3.3 70B model.
 * If the request fails or the response cannot be parsed, fall back to the dynamic
 * script generator.
 */
export async function generateScripts(userPrompt) {
  try {
    const timestamp = Date.now();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY in .env");
    }

    const systemPrompt = `You are a professional short-form video script writer. Generate exactly 3 short video scripts about: "${userPrompt}". 
Return ONLY a valid JSON array of 3 script objects. 
Each object must have: "id", "title", "style", "duration", and an array of 5 "scenes" (each with "sceneNumber", "narration", and "visualPrompt"). 
DO NOT wrap the JSON in markdown fences like \`\`\`json. Return strictly the raw JSON object.
Ensure JSON format is exactly like this:
{ "scripts": [ { "id": "script_1", "title": "...", "style": "...", "duration": "15 seconds", "scenes": [ { "sceneNumber": 1, "narration": "...", "visualPrompt": "..." } ] } ] }`;

    const modelsToTry = [
      "qwen/qwen-2.5-72b-instruct",
      "google/gemini-2.5-flash",
      "meta-llama/llama-3.3-70b-instruct:free"
    ];

    let rawText = null;
    let success = false;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`🤖 Attempting script generation with model: ${model}...`);
        const payload = {
          model: model,
          messages: [
            { role: "system", content: "You are a professional short-form video script writer." },
            { role: "user", content: systemPrompt }
          ],
          response_format: { type: "json_object" },
          max_tokens: 2048
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout per model request

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter
            "X-Title": "AI Video Generator" // Required by OpenRouter
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[${model}] API responded with status ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          rawText = data.choices[0].message.content;
          success = true;
          console.log(`✅ Successfully generated script using model: ${model}`);
          break;
        } else {
          console.warn(`[${model}] Returned empty choices structure`);
        }
      } catch (err) {
        console.warn(`[${model}] Request failed:`, err.message);
        lastError = err;
      }
    }

    if (!success) {
      throw new Error(lastError ? lastError.message : 'All OpenRouter models failed to respond');
    }

    // Extract JSON object from raw text (some models wrap output in code fences anyway)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in OpenRouter response:', rawText);
      throw new Error('Invalid response format');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.scripts || !Array.isArray(parsed.scripts) || parsed.scripts.length < 3) {
      throw new Error('Invalid script payload from OpenRouter');
    }

    const scripts = parsed.scripts.slice(0, 3).map((s, i) => ({
      ...s,
      id: `script_${i + 1}_${timestamp}`,
      scenes: (s.scenes || []).slice(0, 5).map((sc, j) => ({
        ...sc,
        sceneNumber: j + 1,
      })),
    }));

    return { scripts };
  } catch (err) {
    console.error('Script generation error:', err.message);
    // Fallback to dynamic random scripts
    return getFallbackScripts(userPrompt);
  }
}
