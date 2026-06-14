import React, { useRef } from "react";
import { Download, RotateCcw, Play } from "lucide-react";

/**
 * VideoPlayer — shows the final generated video with download and restart options.
 */
export default function VideoPlayer({ videoUrl, onRestart }) {
  const videoRef = useRef(null);

  function handleDownload() {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `ai-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="animate-fade-up" style={{ textAlign: "center" }}>
      <div style={{ marginBottom: 28 }}>
        <p className="section-title" style={{ color: "#34d399" }}>
          ✨ Your Video is Ready!
        </p>
        <p className="section-sub">
          Your AI-generated short video has been rendered. Download or preview below.
        </p>
      </div>

      {/* Video container */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto 32px",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(52,211,153,0.3)",
          boxShadow: "0 0 60px rgba(52,211,153,0.15)",
          position: "relative",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          loop
          style={{ width: "100%", display: "block", maxHeight: 420 }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={handleDownload}
          style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}
        >
          <Download size={16} />
          Download MP4
        </button>

        <button className="btn-secondary" onClick={onRestart}>
          <RotateCcw size={16} />
          Create Another
        </button>
      </div>

      {/* Info note */}
      <div
        style={{
          maxWidth: 480,
          margin: "28px auto 0",
          padding: "14px 18px",
          background: "rgba(52,211,153,0.06)",
          border: "1px solid rgba(52,211,153,0.15)",
          borderRadius: 10,
          fontSize: 13,
          color: "var(--c-muted)",
          lineHeight: 1.6,
        }}
      >
        💡 <strong style={{ color: "var(--c-text)" }}>Coming soon:</strong> Voice-over narration and
        background music. Export to 1080p, 4K, and vertical formats for social media.
      </div>
    </div>
  );
}
