import React, { useState } from "react";
import { CheckCircle2, Film, BookOpen, Zap, Pencil, ChevronDown, ChevronUp } from "lucide-react";

const STYLE_META = {
  "Cinematic Drama":        { icon: Film,     color: "#60a5fa" },
  "Fast-Paced Documentary": { icon: Film,     color: "#f59e0b" },
  "Poetic Voiceover":       { icon: BookOpen, color: "#c084fc" },
  "Mystery Thriller":       { icon: Film,     color: "#6ee7b7" },
  "Inspirational Journey":  { icon: BookOpen, color: "#f472b6" },
  "Data-Driven Explainer":  { icon: Zap,      color: "#38bdf8" },
  "First-Person Narrative": { icon: BookOpen, color: "#fb923c" },
  "Time-Lapse Epic":        { icon: Film,     color: "#a3e635" },
  "Emotional Human Story":  { icon: BookOpen, color: "#f472b6" },
  "Satirical Comedy":       { icon: Zap,      color: "#fbbf24" },
  "Suspense Builder":       { icon: Film,     color: "#f87171" },
  "Future Vision":          { icon: Zap,      color: "#818cf8" },
  "Origin Story":           { icon: BookOpen, color: "#34d399" },
  "Crisis & Resolution":    { icon: Film,     color: "#fb7185" },
  "Expert Interview Style": { icon: Zap,      color: "#22d3ee" },
};

function getStyleMeta(style) {
  return STYLE_META[style] || { icon: Film, color: "#a78bfa" };
}

/** Editable scene row */
function SceneRow({ scene, sceneIndex, accentColor, scriptId, onEdit, editedScripts }) {
  const [expanded, setExpanded] = useState(false);
  const edits = editedScripts?.[scriptId]?.scenes?.[sceneIndex] || {};
  const narration = edits.narration ?? scene.narration;
  const visualPrompt = edits.visualPrompt ?? scene.visualPrompt;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* Scene header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 12px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <span
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 6,
            background: `${accentColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: accentColor,
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {scene.sceneNumber}
        </span>
        <p style={{ fontSize: 13, color: "var(--c-muted)", margin: 0, lineHeight: 1.5, flex: 1, fontStyle: "italic" }}>
          "{narration.slice(0, 90)}{narration.length > 90 ? "…" : ""}"
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Pencil size={11} color="var(--c-muted)" />
          {expanded ? <ChevronUp size={13} color="var(--c-muted)" /> : <ChevronDown size={13} color="var(--c-muted)" />}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding: "0 12px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor, marginTop: 10, marginBottom: 4 }}>
            Narration (Voice-over)
          </label>
          <textarea
            value={narration}
            onChange={(e) => onEdit(scriptId, "narration", e.target.value, sceneIndex)}
            style={{
              width: "100%",
              minHeight: 80,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${accentColor}30`,
              borderRadius: 8,
              padding: "10px 12px",
              color: "var(--c-text)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = accentColor)}
            onBlur={(e) => (e.target.style.borderColor = `${accentColor}30`)}
          />

          <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor, marginTop: 10, marginBottom: 4 }}>
            Visual / Image Prompt
          </label>
          <textarea
            value={visualPrompt}
            onChange={(e) => onEdit(scriptId, "visualPrompt", e.target.value, sceneIndex)}
            style={{
              width: "100%",
              minHeight: 80,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${accentColor}30`,
              borderRadius: 8,
              padding: "10px 12px",
              color: "var(--c-text)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = accentColor)}
            onBlur={(e) => (e.target.style.borderColor = `${accentColor}30`)}
          />
        </div>
      )}
    </div>
  );
}

export default function ScriptCards({ scripts, selectedId, editedScripts, onSelect, onEdit, onContinue, onBack, isLoading }) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
      <div style={{ marginBottom: 28 }}>
        <p className="section-title">Choose Your Script</p>
        <p className="section-sub">
          Three cinematic angles generated. Pick one, then click any scene to edit the narration or visual prompt.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 32 }}>
        {scripts.map((script, idx) => {
          const { icon: Icon, color: accentColor } = getStyleMeta(script.style);
          const isSelected = selectedId === script.id;
          const titleEdited = editedScripts?.[script.id]?.title;
          const displayTitle = titleEdited ?? script.title;

          return (
            <div
              key={script.id}
              className={`card ${isSelected ? "selected" : ""}`}
              style={{ cursor: "pointer", position: "relative", overflow: "hidden", animationDelay: `${idx * 0.1}s` }}
              onClick={() => onSelect(script.id)}
            >
              {isSelected && (
                <div style={{ position: "absolute", top: 16, right: 16, color: "var(--c-accent)" }}>
                  <CheckCircle2 size={22} />
                </div>
              )}

              {/* Style badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColor}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} color={accentColor} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor }}>
                  {script.style}
                </span>
              </div>

              {/* Editable title */}
              {isSelected ? (
                <input
                  value={displayTitle}
                  onChange={(e) => {
                    e.stopPropagation();
                    onEdit(script.id, "title", e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${accentColor}40`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    color: "var(--c-text)",
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 800,
                    marginBottom: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, margin: "0 0 14px", paddingRight: isSelected ? 28 : 0, lineHeight: 1.3 }}>
                  {displayTitle}
                </h3>
              )}

              {/* Scenes */}
              <div>
                {script.scenes.map((scene, i) => (
                  isSelected ? (
                    <div key={scene.sceneNumber} onClick={(e) => e.stopPropagation()}>
                      <SceneRow
                        scene={scene}
                        sceneIndex={i}
                        accentColor={accentColor}
                        scriptId={script.id}
                        onEdit={onEdit}
                        editedScripts={editedScripts}
                      />
                    </div>
                  ) : (
                    <div key={scene.sceneNumber} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ minWidth: 22, height: 22, borderRadius: 6, background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-display)", color: accentColor }}>
                        {scene.sceneNumber}
                      </span>
                      <p style={{ fontSize: 13, color: "var(--c-muted)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                        "{scene.narration.slice(0, 80)}{scene.narration.length > 80 ? "…" : ""}"
                      </p>
                    </div>
                  )
                ))}
              </div>

              {/* Bottom bar */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: isSelected ? `linear-gradient(90deg, var(--c-accent), ${accentColor})` : "transparent", transition: "background 0.3s" }} />
            </div>
          );
        })}
      </div>

      {selectedId && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button className="btn-primary" onClick={onContinue} disabled={isLoading} style={{ minWidth: 220, justifyContent: "center" }}>
            {isLoading ? (
              <><span className="animate-spin-slow" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} /> Generating Images…</>
            ) : (
              "Generate Scene Images →"
            )}
          </button>
        </div>
      )}
    </div>
  );
}