import React, { useState } from "react";
import { Music, Mic, Volume2, VolumeX, Play } from "lucide-react";

const MUSIC_OPTIONS = [
  { id: "epic_cinematic",    label: "Epic Cinematic",     description: "Soaring orchestral with dramatic builds", emoji: "🎼", color: "#818cf8" },
  { id: "uplifting_inspire", label: "Uplifting & Inspire", description: "Warm, motivational with rising energy",   emoji: "✨", color: "#34d399" },
  { id: "dark_suspense",     label: "Dark Suspense",       description: "Tense, atmospheric and brooding",         emoji: "🌑", color: "#f87171" },
  { id: "chill_lo_fi",       label: "Chill Lo-Fi",         description: "Relaxed beats, laid-back and modern",     emoji: "🎧", color: "#60a5fa" },
  { id: "documentary",       label: "Documentary",         description: "Neutral, factual and journalistic",       emoji: "📽️", color: "#fbbf24" },
  { id: "no_music",          label: "No Music",            description: "Narration only, no background track",    emoji: "🔇", color: "#6b7280" },
];

const VOICEOVER_OPTIONS = [
  { id: "deep_male",      label: "Deep & Authoritative", description: "Bold male narrator, commanding presence", emoji: "🎙️", color: "#818cf8" },
  { id: "warm_female",    label: "Warm & Engaging",      description: "Friendly female, clear and trustworthy",  emoji: "🎤", color: "#f472b6" },
  { id: "neutral_ai",     label: "Neutral AI Voice",     description: "Clean, crisp, modern AI narration",       emoji: "🤖", color: "#38bdf8" },
  { id: "whispery",       label: "Intimate Whisper",     description: "Soft, close-mic storytelling style",      emoji: "🌙", color: "#c084fc" },
  { id: "energetic",      label: "High Energy",          description: "Upbeat, fast-paced and enthusiastic",    emoji: "⚡", color: "#fbbf24" },
  { id: "no_voiceover",   label: "No Voice-Over",        description: "Text on screen only, no narration",      emoji: "💬", color: "#6b7280" },
];

function OptionCard({ option, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(option.id)}
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: selected ? `1.5px solid ${option.color}` : "1px solid rgba(255,255,255,0.08)",
        background: selected ? `${option.color}12` : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: selected ? `0 0 20px ${option.color}20` : "none",
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
    >
      <span style={{ fontSize: 22 }}>{option.emoji}</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: selected ? option.color : "var(--c-text)" }}>
          {option.label}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--c-muted)", lineHeight: 1.4 }}>
          {option.description}
        </p>
      </div>
      <div style={{ width: 18, height: 18, borderRadius: "50%", border: selected ? `2px solid ${option.color}` : "2px solid rgba(255,255,255,0.15)", background: selected ? option.color : "transparent", flexShrink: 0, transition: "all 0.2s" }} />
    </div>
  );
}

export default function AudioSelector({ onContinue, onBack, isLoading }) {
  const [selectedMusic, setSelectedMusic] = useState("epic_cinematic");
  const [selectedVoiceover, setSelectedVoiceover] = useState("deep_male");

  function handleContinue() {
    onContinue({ music: selectedMusic, voiceover: selectedVoiceover });
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 32 }}>
        <p className="section-title">Audio & Voice-Over</p>
        <p className="section-sub">
          Choose background music and narration style for your video.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 36 }}>
        {/* Music */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Music size={16} color="#818cf8" />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, margin: 0 }}>Background Music</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MUSIC_OPTIONS.map((opt) => (
              <OptionCard key={opt.id} option={opt} selected={selectedMusic === opt.id} onSelect={setSelectedMusic} />
            ))}
          </div>
        </div>

        {/* Voiceover */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(244,114,182,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mic size={16} color="#f472b6" />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, margin: 0 }}>Voice-Over Style</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {VOICEOVER_OPTIONS.map((opt) => (
              <OptionCard key={opt.id} option={opt} selected={selectedVoiceover === opt.id} onSelect={setSelectedVoiceover} />
            ))}
          </div>
        </div>
      </div>

      {/* Note */}
      <div style={{ maxWidth: 560, margin: "0 auto 28px", padding: "12px 16px", background: "rgba(124,92,252,0.07)", border: "1px solid rgba(124,92,252,0.15)", borderRadius: 10, fontSize: 13, color: "var(--c-muted)", textAlign: "center" }}>
        🎵 Audio will be applied during video rendering. Voice-over uses your script narration automatically.
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <button className="btn-secondary" onClick={onBack}>
          ← Back to Images
        </button>
        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={isLoading}
          style={{ minWidth: 200, justifyContent: "center" }}
        >
          {isLoading ? (
            <><span className="animate-spin-slow" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} /> Rendering…</>
          ) : (
            "🎬 Generate Video →"
          )}
        </button>
      </div>
    </div>
  );
}