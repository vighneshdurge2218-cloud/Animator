import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCdiioVW0vGIxQLfhrHhbKcRnHwfbcgSEM");
const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

async function test() {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "ancient egypt temple" }] }],
      generationConfig: { responseModalities: ["IMAGE"] }
    });
    
    for (const part of result.response.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log("SUCCESS! Got image:", part.inlineData.mimeType, part.inlineData.data.substring(0, 50) + "...");
        return;
      }
    }
  } catch (e) {
    console.error("FAIL:", e.message);
  }
}
test();
