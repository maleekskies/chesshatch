import { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { MessageCircle, RotateCcw, ChevronRight, Sparkles } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import { GUIDED_FIRST_GAME } from "../data/guidedGame.js";

const STEPS = GUIDED_FIRST_GAME.steps;

// A short, fully scripted mini-match for a total beginner's first
// hands-on game: the player plays exactly the White moves in the
// script (enforced — a legal-but-different move is politely declined
// and snaps back, same as any other illegal drop), and Black's replies
// play themselves automatically with a short pause, so it reads like a
// real game happening rather than a lecture. The coach narrates every
// move, on both sides.
export default function GuidedGame({ theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onExit, onGoToLessons, onGoToPlay }) {
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;
  const [version, setVersion] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [narration, setNarration] = useState(GUIDED_FIRST_GAME.intro);
  const [hint, setHint] = useState(null);
  const hintTimerRef = useRef(null);

  const finished = stepIndex >= STEPS.length;
  const currentStep = finished ? null : STEPS[stepIndex];
  const awaitingUser = currentStep?.mover === "white";

  // Whenever it becomes Black's turn in the script, play it
  // automatically after a short pause so the opponent's move reads as
  // a real reply rather than an instant, jarring jump.
  useEffect(() => {
    if (finished || currentStep?.mover !== "black") return;
    const t = setTimeout(() => {
      const move = chess.move({ from: currentStep.from, to: currentStep.to, promotion: "q" });
      if (move) {
        setVersion((v) => v + 1);
        setNarration(currentStep.say);
        setStepIndex((i) => i + 1);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); }, []);

  function onPieceDrop(from, to) {
    if (!awaitingUser) return false;
    if (from !== currentStep.from || to !== currentStep.to) {
      // Legal chess move, just not the one the script calls for here —
      // decline it (the board snaps it back) and nudge toward the
      // intended move instead of silently doing nothing.
      setHint(`Try ${currentStep.prompt.replace(/^Play /, "")}`);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setHint(null), 2600);
      return false;
    }
    const move = chess.move({ from, to, promotion: "q" });
    if (!move) return false;
    setHint(null);
    setNarration(currentStep.say);
    setVersion((v) => v + 1);
    setStepIndex((i) => i + 1);
    return true;
  }

  function restart() {
    chess.reset();
    setStepIndex(0);
    setNarration(GUIDED_FIRST_GAME.intro);
    setHint(null);
    setVersion((v) => v + 1);
  }

  const boardWidth = isPhone
    ? Math.min(340, window.innerWidth - 48)
    : Math.min(520, Math.max(380, window.innerWidth - 560));

  return (
    <div>
      <button onClick={onExit} style={{ background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        ← Skip guided game
      </button>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ flex: "0 0 auto" }}>
          <ChessBoard fen={chess.fen()} onPieceDrop={onPieceDrop} theme={theme} boardWidth={boardWidth} arePiecesDraggable={awaitingUser} />

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
              {finished ? "Game complete" : awaitingUser ? "Your move" : "Black is replying…"}
            </span>
            <button onClick={restart} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, color: textMuted, borderRadius: 6, padding: "5px 9px", fontSize: 11.5, cursor: "pointer" }}>
              <RotateCcw size={12} /> Restart
            </button>
          </div>
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 260, maxWidth: 340, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Sparkles size={14} color={accentGold} />
            <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>{GUIDED_FIRST_GAME.title}</span>
          </div>
          <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 14 }}>
            {finished ? "Complete" : `Move ${Math.floor(stepIndex / 2) + 1} of ${Math.ceil(STEPS.length / 2)}`}
          </div>

          {!finished && awaitingUser && (
            <div style={{ background: "rgba(201,162,39,0.1)", border: `1px solid ${accentGold}`, borderRadius: 8, padding: "9px 11px", fontSize: 12.5, color: textMain, marginBottom: 12, lineHeight: 1.5 }}>
              {currentStep.prompt}
            </div>
          )}
          {hint && (
            <div style={{ fontSize: 11.5, color: "#E0A25B", marginBottom: 12 }}>{hint}</div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <MessageCircle size={14} color={accentGold} />
            <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Coach</span>
          </div>
          <div role="status" aria-live="polite" style={{ minHeight: 70, padding: "10px 12px", borderRadius: 8, background: "rgba(201,162,39,0.05)", border: `1px solid ${borderCol}`, fontSize: 12.5, color: textMain, lineHeight: 1.5 }}>
            {narration}
          </div>

          {finished && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.5, marginBottom: 12 }}>{GUIDED_FIRST_GAME.outro}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={onGoToLessons} style={{ background: accentGold, color: "#1B2430", border: "none", borderRadius: 7, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  Start Tier 1 lessons <ChevronRight size={13} />
                </button>
                <button onClick={onGoToPlay} style={{ background: "transparent", color: textMain, border: `1px solid ${borderCol}`, borderRadius: 7, padding: "9px 14px", fontSize: 12.5, cursor: "pointer" }}>
                  Play freely
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
