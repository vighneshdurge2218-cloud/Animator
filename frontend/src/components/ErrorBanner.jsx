import React from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * ErrorBanner — non-crashing inline error display.
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      className="animate-fade-up"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 18px",
        background: "rgba(252,92,125,0.08)",
        border: "1px solid rgba(252,92,125,0.25)",
        borderRadius: 12,
        marginBottom: 24,
        maxWidth: 680,
        margin: "0 auto 24px",
      }}
    >
      <AlertTriangle size={18} color="#fc5c7d" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#fc5c7d",
            fontWeight: 600,
            fontFamily: "var(--font-display)",
            marginBottom: 2,
          }}
        >
          Something went wrong
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--c-muted)", lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--c-muted)",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
