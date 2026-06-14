import React from "react";
import { Check, ChevronLeft } from "lucide-react";

const STEPS = ["Prompt", "Scripts", "Images", "Audio", "Video"];

export default function StepIndicator({ currentStep, onBack }) {
  return (
    <div style={{ marginBottom: 40 }}>
      {/* Back button */}
      {currentStep > 0 && onBack && (
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            color: "var(--c-muted)",
            cursor: "pointer",
            marginBottom: 24,
            transition: "all 0.15s",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "var(--c-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "var(--c-muted)";
          }}
        >
          <ChevronLeft size={14} />
          Back
        </button>
      )}

      {/* Step dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <React.Fragment key={label}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: done
                      ? "var(--c-accent)"
                      : active
                      ? "linear-gradient(135deg, #7c5cfc, #fc5c7d)"
                      : "rgba(255,255,255,0.06)",
                    border: active
                      ? "none"
                      : done
                      ? "none"
                      : "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s",
                    boxShadow: active ? "0 0 20px rgba(124,92,252,0.5)" : "none",
                  }}
                >
                  {done ? (
                    <Check size={14} color="white" />
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "var(--font-display)",
                        color: active ? "white" : "var(--c-muted)",
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: active ? "var(--c-text)" : done ? "var(--c-accent)" : "var(--c-muted)",
                  }}
                >
                  {label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  style={{
                    height: 1,
                    width: 60,
                    marginBottom: 22,
                    background: i < currentStep
                      ? "var(--c-accent)"
                      : "rgba(255,255,255,0.1)",
                    transition: "background 0.3s",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}