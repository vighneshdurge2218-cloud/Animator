# 🎬 AI Video Generator

A production-ready full-stack web app that generates short cinematic videos from a text prompt using:
- **Google Gemini** (script generation — free tier)
- **Pollinations.ai** (image generation — completely free, no API key needed)
- **FFmpeg** (video rendering)

---

## 📁 Project Structure

```
ai-video-generator/
├── backend/
│   ├── routes/
│   │   ├── scriptRoutes.js     # POST /api/script/generate
│   │   ├── imageRoutes.js      # POST /api/image/generate
│   │   └── videoRoutes.js      # POST /api/video/generate
│   ├── services/
│   │   ├── geminiService.js    # Gemini API + fallback scripts
│   │   ├── imageService.js     # Pollinations image download
│   │   └── videoService.js     # FFmpeg MP4 generation
│   ├── utils/
│   │   └── fallbackScripts.js  # Static fallback when Gemini fails
│   ├── outputs/                # Generated images + videos (auto-created)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── CreateVideoPage.jsx   # Main orchestration page
│   │   ├── components/
│   │   │   ├── PromptInput.jsx
│   │   │   ├── ScriptCards.jsx
│   │   │   ├── SceneGrid.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── StepIndicator.jsx
│   │   │   └── ErrorBanner.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios API calls to backend
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** 18+
- **FFmpeg** installed on your system

#### Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH.

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
GEMINI_API_KEY=your_actual_gemini_api_key
```

Get a free Gemini API key at: https://aistudio.google.com/app/apikey

> **Note:** If you don't add a Gemini API key, the app will still work using built-in fallback scripts.

Start the backend:
```bash
npm run dev
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

---

## 🎯 How It Works

1. **User enters a prompt** → e.g., "The history of space exploration"
2. **Gemini generates 3 script options**, each with 4 scenes (narration + visual description)
3. **User selects one script**
4. **Pollinations.ai generates cinematic images** for each scene (downloaded server-side)
5. **User previews scene images**
6. **FFmpeg combines images** into an MP4 video (3 seconds per scene)
7. **User downloads** the final video

---

## 🔑 API Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/script/generate` | POST | Generate 3 scripts from prompt |
| `/api/image/generate` | POST | Download all scene images |
| `/api/video/generate` | POST | Render final MP4 video |
| `/outputs/:jobId/output.mp4` | GET | Stream/download generated video |
| `/health` | GET | Backend health check |

---

## 🛡️ Error Handling

- If Gemini API fails → uses built-in fallback scripts
- If an image fails to download → creates a solid-color placeholder so video still renders
- All errors are shown in the UI without crashing

---

## 🔮 Future Enhancements

- [ ] Voice-over narration (ElevenLabs API)
- [ ] Background music
- [ ] Text overlay / captions on scenes
- [ ] 1080p / vertical (9:16) export
- [ ] User history / saved projects
