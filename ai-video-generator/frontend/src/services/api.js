import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  timeout: 180000, // 3 min — image + video generation can be slow
  headers: { "Content-Type": "application/json" },
});

// Normalise errors
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Unknown error";
    return Promise.reject(new Error(message));
  }
);

/**
 * Generate 3 unique script options from a user prompt.
 */
export async function generateScripts(prompt) {
  const { data } = await API.post("/script/generate", { prompt });
  return data;
}

/**
 * Generate context-aware scene images for the selected script.
 * Passes scriptTitle and scriptStyle so the image service can build richer prompts.
 */
export async function generateImages(scenes, jobId = null, scriptTitle = "", scriptStyle = "") {
  const payload = { scenes, scriptTitle, scriptStyle };
  if (jobId) payload.jobId = jobId;
  const { data } = await API.post("/image/generate", payload);
  return data;
}

/**
 * Regenerate a single scene image.
 */
export async function regenerateImage(scene, jobId, scriptTitle = "", scriptStyle = "") {
  const { data } = await API.post("/image/regenerate", { scene, jobId, scriptTitle, scriptStyle });
  return data;
}

/**
 * Generate the final MP4 video from downloaded images.
 */
export async function generateVideo(jobId, scenes) {
  const { data } = await API.post("/video/generate", { jobId, scenes });
  return data;
}