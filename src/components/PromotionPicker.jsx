// Small overlay for choosing a promotion piece, instead of always
// auto-queening. Shown when onPieceDrop detects a pawn reaching the
// back rank and needs the player to choose before the move completes.
const PIECES = [
  { key: "q", label: "Queen" },
  { key: "r", label: "Rook" },
  { key: "b", label: "Bishop" },
  { key: "n", label: "Knight" },
];

export default function PromotionPicker({ color, onPick, panelBg, borderCol, textMain, accentGold }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 25, borderRadius: 4,
    }}>
      <div style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 12, color: textMain, marginBottom: 10, textAlign: "center" }}>Promote to:</div>
        <div style={{ display: "flex", gap: 8 }}>
          {PIECES.map((p) => (
            <button key={p.key} onClick={() => onPick(p.key)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${borderCol}`, background: "transparent", color: textMain, fontSize: 13, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = accentGold}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = borderCol}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
