import React, { useState } from "react";
import { Sparkles, Wand2, HelpCircle, X, Film, Image, Music, Zap } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "The future of artificial intelligence",
  "How black holes are formed",
  "Ancient civilizations of Egypt",
  "The science of sleep and dreams",
  "Climate change and ocean ecosystems",
];

const FEATURES = [
  { icon: Zap, color: "#818cf8", label: "AI Scripts", desc: "3 unique cinematic scripts generated every time" },
  { icon: Image, color: "#34d399", label: "Scene Images", desc: "Context-aware AI images that match your script" },
  { icon: Music, color: "#f472b6", label: "Audio & Voice", desc: "Background music + voice-over narration styles" },
  { icon: Film, color: "#fbbf24", label: "Auto Video", desc: "Animated Ken Burns video rendered with ffmpeg" },
];

function HelpModal({ onClose }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: 560, width: "100%", background: "#13111c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 36, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color="white" />
        </button>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, margin: "0 0 8px", background: "linear-gradient(135deg, #a78bfa, #fc5c7d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          How It Works
        </h2>
        <p style={{ color: "var(--c-muted)", fontSize: 14, marginBottom: 24 }}>
          AI Video Generator turns your text idea into a fully animated short film in 4 steps.
        </p>

        {[
          { step: "1", title: "Describe Your Topic", body: "Type any subject — a story, concept, or idea. The AI generates 3 completely different script styles with unique cinematic angles every time." },
          { step: "2", title: "Pick & Edit Your Script", body: "Choose the script that resonates. Click any scene to edit the narration or visual prompt — customize it exactly how you want." },
          { step: "3", title: "Review AI Scene Images", body: "Each scene gets a context-aware cinematic image that matches the full story. Regenerate any image you don't like with one click." },
          { step: "4", title: "Add Audio & Export", body: "Choose background music and voice-over style. The system renders your video with smooth Ken Burns animations using ffmpeg." },
        ].map(({ step, title, body }) => (
          <div key={step} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #7c5cfc, #fc5c7d)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "white" }}>{step}</span>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, margin: "4px 0 4px", color: "var(--c-text)" }}>{title}</p>
              <p style={{ fontSize: 13, color: "var(--c-muted)", margin: 0, lineHeight: 1.5 }}>{body}</p>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.15)", borderRadius: 10, fontSize: 13, color: "var(--c-muted)" }}>
          💡 <strong style={{ color: "var(--c-text)" }}>Pro tip:</strong> The more specific your topic description, the richer and more unique the generated scripts and images will be.
        </div>
      </div>
    </div>
  );
}

export default function PromptInput({ onGenerate, isLoading }) {
  const [value, setValue] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim()) onGenerate(value.trim());
  }

  return (
    <>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {/* Hero header */}
        <div style={{ marginBottom: 48, textAlign: "center", position: "relative" }}>
          <button
            onClick={() => setShowHelp(true)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              color: "var(--c-muted)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,92,252,0.15)"; e.currentTarget.style.color = "#a78bfa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--c-muted)"; }}
          >
            <HelpCircle size={14} />
            How it works
          </button>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg, #7c5cfc, #fc5c7d)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 50px rgba(124,92,252,0.55), 0 0 100px rgba(124,92,252,0.2)" }}>
              <Wand2 size={32} color="white" />
            </div>
          </div>

          <div style={{ display: "inline-block", background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa", marginBottom: 14 }}>
            The Future of Animation
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 5.5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", background: "linear-gradient(135deg, #e8e6f0 0%, #a78bfa 45%, #fc5c7d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.05 }}>
            ANIMaiTOR
          </h1>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--c-muted)", marginTop: 0, maxWidth: 500, marginInline: "auto", lineHeight: 1.7 }}>
            Type any topic. We craft cinematic scripts, generate AI scene images, add music & voice-over, and produce your animated video — fully automatically.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
          {FEATURES.map(({ icon: Icon, color, label, desc }) => (
            <div
              key={label}
              title={desc}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: `${color}10`,
                border: `1px solid ${color}25`,
                borderRadius: 20,
                padding: "6px 14px",
                cursor: "default",
              }}
            >
              <Icon size={13} color={color} />
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)", color: color }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Input card */}
        <div className="card" style={{ maxWidth: 680, margin: "0 auto" }}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 10 }}>
              Your Video Topic
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. The rise and fall of the Roman Empire..."
              disabled={isLoading}
              maxLength={500}
              style={{ width: "100%", minHeight: 100, background: "rgba(255,255,255,0.03)", border: "1px solid var(--c-border)", borderRadius: 10, padding: "14px 16px", color: "var(--c-text)", fontFamily: "var(--font-body)", fontSize: 15, resize: "vertical", outline: "none", transition: "border-color 0.2s", lineHeight: 1.6, boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--c-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "var(--c-muted)" }}>{value.length} / 500</span>
              <button type="submit" className="btn-primary" disabled={isLoading || value.trim().length === 0}>
                {isLoading ? (
                  <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="animate-spin-slow" /> Generating Scripts…</>
                ) : (
                  <><Sparkles size={16} /> Generate Scripts</>
                )}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--c-border)" }}>
            <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 10, fontWeight: 500 }}>Try an example:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setValue(ex)}
                  disabled={isLoading}
                  style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#a78bfa", cursor: "pointer", fontFamily: "var(--font-body)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.target.style.background = "rgba(124,92,252,0.18)")}
                  onMouseLeave={(e) => (e.target.style.background = "rgba(124,92,252,0.08)")}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}