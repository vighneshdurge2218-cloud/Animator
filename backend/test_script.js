import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const userPrompt = "The science of sleep and dreams";
const systemPrompt = `You are a professional short-form video script writer. Generate exactly 3 short video scripts about: "${userPrompt}". 
Return ONLY a valid JSON array of 3 script objects. 
Each object must have: "id", "title", "style", "duration", and an array of 5 "scenes" (each with "sceneNumber", "narration", and "visualPrompt"). 
DO NOT wrap the JSON in markdown fences like \`\`\`json. Return strictly the raw JSON object.
Ensure JSON format is exactly like this:
{ "scripts": [ { "id": "script_1", "title": "...", "style": "...", "duration": "15 seconds", "scenes": [ { "sceneNumber": 1, "narration": "...", "visualPrompt": "..." } ] } ] }`;

async function test() {
  console.log("Testing qwen/qwen-2.5-72b-instruct with max_tokens: 2048...");
  const apiKey = process.env.OPENROUTER_API_KEY;
  const payload = {
    model: "qwen/qwen-2.5-72b-instruct",
    messages: [
      { role: "system", content: "You are a professional short-form video script writer." },
      { role: "user", content: systemPrompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048
  };

  try {
    const startTime = Date.now();
    console.log("Sending request...");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Video Generator"
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    const data = await response.json();
    console.log(`Finished in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log("Result content:", data.choices?.[0]?.message?.content?.substring(0, 300) + "...");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
