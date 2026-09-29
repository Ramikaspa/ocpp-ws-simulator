import { ImageResponse } from "next/og";

/**
 * Branded 1200×630 social preview card (Open Graph / X), drawn with the app's
 * dark palette. Used by every opengraph-image route.
 */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#f0f2f5",
        backgroundColor: "#0f1117",
        backgroundImage:
          "radial-gradient(circle at 10% 0%, rgba(124,58,237,0.38), transparent 55%), radial-gradient(circle at 100% 100%, rgba(139,92,246,0.2), transparent 50%)",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <svg
          width="72"
          height="72"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Logo"
        >
          <path
            d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"
            fill="#7c3aed"
            fillOpacity="0.25"
          />
          <path
            d="M50 10 A 40 40 0 1 0 90 50"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="90" cy="50" r="8" fill="#7c3aed" />
          <circle cx="50" cy="10" r="8" fill="#c4b5fd" />
          <path
            d="M55 22 L32 55 L48 55 L42 82 L72 45 L52 45 Z"
            fill="#c4b5fd"
          />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 34, fontWeight: 700 }}>
            OCPP WS Simulator
          </span>
          <span style={{ fontSize: 24, color: "#a0a8b8" }}>
            ocpp.rohittiwari.me
          </span>
        </div>
      </div>

      {/* Headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {eyebrow && (
          <span
            style={{
              fontSize: 26,
              color: "#c4b5fd",
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            {eyebrow}
          </span>
        )}
        <span style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.08 }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 30, color: "#a0a8b8", lineHeight: 1.3 }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* Protocol chips */}
      <div style={{ display: "flex", gap: 14 }}>
        {["OCPP 1.6J", "OCPP 2.0.1", "OCPP 2.1", "Free & open source"].map(
          (t) => (
            <span
              key={t}
              style={{
                fontSize: 24,
                padding: "10px 20px",
                borderRadius: 999,
                border: "2px solid #4b5268",
                color: "#c3c9d5",
              }}
            >
              {t}
            </span>
          ),
        )}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
