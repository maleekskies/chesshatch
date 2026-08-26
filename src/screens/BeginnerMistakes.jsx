import { ChevronLeft, XCircle } from "lucide-react";
import { BEGINNER_MISTAKES } from "../data/beginnerMistakes.js";

export default function BeginnerMistakes({ textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onBack }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        <ChevronLeft size={14} /> Back to lessons
      </button>

      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isPhone ? 22 : 26, fontWeight: 700, margin: "0 0 8px" }}>
        Common Beginner Mistakes
      </h2>
      <p style={{ color: textMuted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 24, maxWidth: 560 }}>
        Almost every beginner game is decided by a handful of the same recurring mistakes, not by anything fancy on your opponent's part. Knowing what to watch for is half the battle.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {BEGINNER_MISTAKES.map((m, i) => (
          <div key={i} style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <XCircle size={15} color={accentGold} style={{ marginTop: 2, flexShrink: 0 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: textMain, margin: 0 }}>{m.title}</h3>
            </div>
            <p style={{ fontSize: 13, color: textMain, lineHeight: 1.6, margin: "0 0 8px" }}>{m.mistake}</p>
            <p style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.6, margin: "0 0 8px" }}>
              <span style={{ fontWeight: 600, color: textMuted }}>Why it hurts: </span>{m.why}
            </p>
            <p style={{ fontSize: 12.5, color: accentGold, lineHeight: 1.6, margin: 0 }}>
              <span style={{ fontWeight: 600 }}>Do this instead: </span>
              <span style={{ color: textMain }}>{m.instead}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
