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

    const payload = {
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [
        { role: "system", content: systemPrompt }
      ],
      response_format: { type: "json_object" }
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter
        "X-Title": "AI Video Generator" // Required by OpenRouter
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('OpenRouter API responded with status', response.status, errText);
      throw new Error('OpenRouter request failed');
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;

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
