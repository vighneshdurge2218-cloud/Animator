import { Client, handle_file } from "@gradio/client";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    const token = process.env.HF_TOKEN;
    console.log("HF_TOKEN loaded:", token ? "YES (" + token.substring(0, 8) + "...)" : "NO");

    console.log("Connecting to Gradio space with token...");
    const app = await Client.connect("wangfuyun/AnimateLCM-I2V", {
      hf_token: token
    });
    console.log("App loaded. Testing prediction...");
    
    // We need an image
    const imagePath = "outputs/ced24f83-e3d2-4b95-a328-7dd86872bc60/scene_0.jpg";
    if (!fs.existsSync(imagePath)) {
      console.log("Image not found");
      return;
    }

    console.log("Sending request to AnimateLCM...");
    const result = await app.predict("/generate_video", [
      handle_file(imagePath),
      "", // prompt
      "bad quality", // negative prompt
      0, // seed
      0.8, // cfg scale
      10, // steps (AnimateLCM needs very few)
      14, // motion bucket id
    ]);

    console.log("Prediction complete!");
    console.log(result);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
