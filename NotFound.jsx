export default function NotFound({ textMain, textMuted, accentGold, isPhone, onGoHome }) {
  return (
    <div style={{ textAlign: "center", padding: isPhone ? "48px 16px" : "80px 16px" }}>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: isPhone ? 48 : 64, fontWeight: 700, color: accentGold, marginBottom: 8 }}>
        404
      </div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: isPhone ? 20 : 24, fontWeight: 700, margin: "0 0 10px" }}>
        This page doesn't exist
      </h2>
      <p style={{ color: textMuted, fontSize: 14, marginBottom: 24, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
        The link you followed might be broken, or the page may have moved.
      </p>
      <button onClick={onGoHome} style={{ background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 16, padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Back to ChessHatch
      </button>
    </div>
  );
}
