import React, { useState } from "react";
import { ImageOff, ZoomIn, RefreshCw, X } from "lucide-react";

const BACKEND = "http://localhost:5001";

function buildSrc(image) {
  if (image.imageUrl) return image.imageUrl;
  if (image.localPath) {
    const clean = image.localPath.replace(/\\/g, "/");
    return `${BACKEND}/${clean}`;
  }
  return null;
}

function SceneCard({ image, onRegenerate }) {
  const [status, setStatus] = useState(image.status === "error" ? "error" : "loading");
  const [zoomed, setZoomed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const src = buildSrc(image);

  async function handleRegenerate(e) {
    e.stopPropagation();
    setRegenerating(true);
    setStatus("loading");
    try {
      await onRegenerate(image);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <>
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", position: "relative", cursor: status === "loaded" ? "pointer" : "default" }}
        onClick={() => status === "loaded" && setZoomed(true)}
      >
        {/* Loading shimmer */}
        {status === "loading" && (
          <div className="shimmer" style={{ width: "100%", aspectRatio: "16/9" }} />
        )}

        {/* Image */}
        {src && status !== "error" && (
          <img
            src={src}
            alt={`Scene ${image.sceneNumber}`}
            key={src}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: status === "loaded" ? "block" : "none" }}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        )}

        {/* Error state */}
        {(status === "error" || !src) && (
          <div style={{ width: "100%", aspectRatio: "16/9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", gap: 8, color: "var(--c-muted)" }}>
            <ImageOff size={28} />
            <span style={{ fontSize: 12 }}>Image unavailable</span>
          </div>
        )}

        {/* Regenerate button */}
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
            transition: "background 0.15s",
          }}
          title="Regenerate this image"
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,92,252,0.8)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.7)")}
        >
          <RefreshCw size={14} color="white" style={{ animation: regenerating ? "spin 1s linear infinite" : "none" }} />
        </button>

        {/* Zoom icon */}
        {status === "loaded" && (
          <div
            style={{ position: "absolute", top: 10, right: 48, width: 32, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s", opacity: 0 }}
            className="zoom-icon"
          >
            <ZoomIn size={14} color="white" />
          </div>
        )}

        {/* Scene label */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 14px 12px", background: "linear-gradient(to top, rgba(0,0,0,0.88), transparent)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(124,92,252,0.85)", borderRadius: 5, padding: "2px 7px", color: "white" }}>
            Scene {image.sceneNumber}
          </span>
          {image.narration && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: "4px 0 0", fontStyle: "italic", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              "{image.narration.slice(0, 100)}{image.narration.length > 100 ? "…" : ""}"
            </p>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {zoomed && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setZoomed(false)}
        >
          <button onClick={() => setZoomed(false)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={18} color="white" />
          </button>
          <img src={src} alt={`Scene ${image.sceneNumber} full`} style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} />
          {image.narration && (
            <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", borderRadius: 10, padding: "10px 20px", maxWidth: 600, textAlign: "center" }}>
              <p style={{ color: "white", fontSize: 14, fontStyle: "italic", margin: 0 }}>"{image.narration}"</p>
            </div>
          )}
        </div>
      )}

      <style>{`.card:hover .zoom-icon { opacity: 1 !important; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function SceneGrid({ images, onRegenerate, onContinue, onBack, isLoading }) {
  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <p className="section-title">Generated Scenes</p>
        <p className="section-sub">
          {images.length} AI-generated cinematic scenes. Click 🔄 on any image to regenerate it. Click an image to view full size.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
        {images.map((image, idx) => (
          <div key={`${image.sceneNumber}-${image.localPath}`} className="animate-fade-up" style={{ animationDelay: `${idx * 0.08}s` }}>
            <SceneCard image={image} onRegenerate={onRegenerate} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <button className="btn-secondary" onClick={onBack}>
          ← Back to Scripts
        </button>
        <button
          className="btn-primary"
          onClick={onContinue}
          disabled={isLoading}
          style={{ minWidth: 200, justifyContent: "center", background: "linear-gradient(135deg, #7c5cfc, #fc5c7d)" }}
        >
          {isLoading ? (
            <><span className="animate-spin-slow" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} /> Please wait…</>
          ) : (
            "Add Audio & Music →"
          )}
        </button>
      </div>
    </div>
  );
}