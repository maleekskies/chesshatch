import { useState, useMemo } from "react";
import { ChevronLeft, BookOpen } from "lucide-react";
import { GLOSSARY } from "../data/glossary.js";

// A dedicated, browsable version of the same glossary that already
// powers the inline hover tooltips (via Term.jsx) elsewhere in the
// app. Deliberately reuses GLOSSARY directly rather than keeping a
// second copy of definitions that could drift out of sync.
export default function Glossary({ textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onBack }) {
  const [query, setQuery] = useState("");

  const terms = useMemo(() => {
    const all = Object.entries(GLOSSARY).sort(([a], [b]) => a.localeCompare(b));
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter(([term, def]) => term.toLowerCase().includes(q) || def.toLowerCase().includes(q));
  }, [query]);

  return (
    <div style={{ maxWidth: 680 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        <ChevronLeft size={14} /> Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <BookOpen size={20} color={accentGold} />
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isPhone ? 22 : 26, fontWeight: 700, margin: 0 }}>
          Glossary
        </h2>
      </div>
      <p style={{ color: textMuted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 18, maxWidth: 560 }}>
        Every chess term used across ChessPath's lessons and coaching, in one place — the same definitions you'll see if you hover a highlighted word mid-lesson.
      </p>

      <div style={{ marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms…"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${borderCol}`, background: panelBg, color: textMain, fontSize: 13.5, outline: "none" }}
        />
      </div>

      {terms.length === 0 && (
        <p style={{ color: textMuted, fontSize: 13 }}>No terms match "{query}".</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {terms.map(([term, def]) => (
          <div key={term} style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: "13px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: accentGold, marginBottom: 4, textTransform: "capitalize" }}>{term}</div>
            <div style={{ fontSize: 13, color: textMain, lineHeight: 1.55 }}>{def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
