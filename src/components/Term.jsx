import { useState } from "react";
import { GLOSSARY } from "../data/glossary.js";

// Wraps a glossary word in explanation text. Tap/hover reveals the
// definition inline instead of assuming the reader already knows it.
// meant for exactly the "what does 'opposition' mean" moment mid-lesson.
export default function Term({ word, textMain, accentGold, panelBg, borderCol }) {
  const [open, setOpen] = useState(false);
  const def = GLOSSARY[word.toLowerCase()];
  if (!def) return <span>{word}</span>;

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{ color: accentGold, textDecoration: "underline dotted", cursor: "help" }}
      >
        {word}
      </span>
      {open && (
        <span
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 30,
            background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 8,
            padding: "8px 11px", fontSize: 12, color: textMain, width: 220,
            lineHeight: 1.5, boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          }}
        >
          {def}
        </span>
      )}
    </span>
  );
}
