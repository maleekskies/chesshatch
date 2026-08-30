import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Bot, Users, RotateCcw, MessageCircle, Undo2, Share2, Copy } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import PromotionPicker from "../components/PromotionPicker.jsx";
import { analyzeMove, squareToRC } from "../lib/coach.js";
import { createEngine, DIFFICULTY_PRESETS } from "../lib/stockfish.js";
import { giveMoveFeedback } from "../lib/moveFeedback.js";

// Play screen: two modes.
//  - "practice": pass-and-play, with the live coach commenting after
//    every move, undo, and position export/share.
//  - "computer": play against offline Stockfish at a chosen difficulty.
export default function Play({ theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onEarnBadge }) {
  const [mode, setMode] = useState("practice"); // practice | computer
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;
  const [version, setVersion] = useState(0);
  const [coachMsg, setCoachMsg] = useState(null);
  const [selectedPly, setSelectedPly] = useState(null); // for "explain this move"
  const [difficulty, setDifficulty] = useState(DIFFICULTY_PRESETS[0]);
  const engineRef = useRef(null);
  const [engineThinking, setEngineThinking] = useState(false);
  const [playerColor] = useState("w"); // player is always White vs computer, for simplicity
  const [shareOpen, setShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to, moverColor } | null

  useEffect(() => {
    if (mode === "computer" && !engineRef.current) {
      engineRef.current = createEngine();
      engineRef.current.setSkillLevel(difficulty.skillLevel);
    }
    return () => {
      if (engineRef.current) { engineRef.current.destroy(); engineRef.current = null; }
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (engineRef.current) engineRef.current.setSkillLevel(difficulty.skillLevel);
  }, [difficulty]);

  function statusFlags() {
    return { isCheck: chess.isCheck(), isCheckmate: chess.isCheckmate(), isStalemate: chess.isStalemate() };
  }

  function runCoach(moverColor, toSquare) {
    const flags = statusFlags();
    const msg = analyzeMove({ board: chess.board(), moverColor, toSquare, ...flags });
    setCoachMsg(msg);
  }

  const requestEngineMove = useCallback(() => {
    if (!engineRef.current || chess.isGameOver()) return;
    setEngineThinking(true);
    engineRef.current.getBestMove(chess.fen(), { moveTimeMs: difficulty.moveTimeMs }).then((uci) => {
      if (!uci || uci === "(none)") { setEngineThinking(false); return; }
      const from = uci.slice(0, 2), to = uci.slice(2, 4), promo = uci.slice(4) || undefined;
      chess.move({ from, to, promotion: promo || "q" });
      giveMoveFeedback();
      setEngineThinking(false);
      setVersion((v) => v + 1);
      runCoach("b", to);
      if (chess.isGameOver()) onEarnBadge?.("first_game");
    });
  }, [difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  function isPromotionMove(from, to) {
    const piece = chess.get(from);
    if (!piece || piece.type !== "p") return false;
    const targetRank = to[1];
    return (piece.color === "w" && targetRank === "8") || (piece.color === "b" && targetRank === "1");
  }

  function completeMove(from, to, promotion) {
    const moverColor = chess.turn();
    const move = chess.move({ from, to, promotion: promotion || undefined });
    if (!move) return false;
    setSelectedPly(null);
    setVersion((v) => v + 1);
    runCoach(moverColor, to);
    if (chess.isCheckmate()) onEarnBadge?.("first_checkmate");
    if (chess.isGameOver()) onEarnBadge?.("first_game");
    if (mode === "computer" && !chess.isGameOver()) {
      setTimeout(requestEngineMove, 300);
    }
    return true;
  }

  function onPieceDrop(sourceSquare, targetSquare) {
    const moverColor = chess.turn();
    if (mode === "computer" && moverColor !== playerColor) return false;
    if (isPromotionMove(sourceSquare, targetSquare)) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare, moverColor });
      return true; // tentatively accept; PromotionPicker resolves the actual move
    }
    return completeMove(sourceSquare, targetSquare, null);
  }

  function resolvePromotion(pieceKey) {
    if (!pendingPromotion) return;
    completeMove(pendingPromotion.from, pendingPromotion.to, pieceKey);
    setPendingPromotion(null);
  }

  function resetGame() {
    chess.reset();
    setCoachMsg(null);
    setSelectedPly(null);
    setVersion((v) => v + 1);
  }

  function undoMove() {
    // In vs-computer mode, undo both the player's move and the engine's
    // reply so it's always the player's turn again after undoing.
    chess.undo();
    if (mode === "computer" && chess.history().length > 0 && chess.turn() !== playerColor) {
      chess.undo();
    }
    setCoachMsg(null);
    setSelectedPly(null);
    setVersion((v) => v + 1);
  }

  // "Explain this move", replay the game up to a chosen ply and re-run
  // the same coach analysis used live, so past moves get the same
  // scrutiny as the current one.
  function explainPly(index) {
    const historyVerbose = chess.history({ verbose: true });
    if (index < 0 || index >= historyVerbose.length) return;
    const replay = new Chess();
    for (let i = 0; i <= index; i++) {
      replay.move({ from: historyVerbose[i].from, to: historyVerbose[i].to, promotion: historyVerbose[i].promotion || "q" });
    }
    const moverColor = historyVerbose[index].color;
    const msg = analyzeMove({
      board: replay.board(),
      moverColor,
      toSquare: historyVerbose[index].to,
      isCheck: replay.isCheck(),
      isCheckmate: replay.isCheckmate(),
      isStalemate: replay.isStalemate(),
    });
    setSelectedPly(index);
    setCoachMsg(msg || { tone: "notice", text: "Nothing flagged on this move, looked like a reasonable choice." });
  }

  function copyPGN() {
    const pgn = chess.pgn() || "(no moves yet)";
    navigator.clipboard?.writeText(pgn).then(() => {
      setCopyStatus("PGN copied");
      setTimeout(() => setCopyStatus(null), 1800);
    });
  }
  function copyFEN() {
    navigator.clipboard?.writeText(chess.fen()).then(() => {
      setCopyStatus("Position (FEN) copied");
      setTimeout(() => setCopyStatus(null), 1800);
    });
  }

  const boardWidth = isPhone
    ? Math.min(340, window.innerWidth - 48)
    : Math.min(560, Math.max(420, window.innerWidth - 560));
  const historySAN = chess.history();

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ flex: "0 0 auto", position: "relative" }}>
        {pendingPromotion && (
          <PromotionPicker color={pendingPromotion.moverColor} onPick={resolvePromotion} panelBg={panelBg} borderCol={borderCol} textMain={textMain} accentGold={accentGold} />
        )}
        <ChessBoard fen={chess.fen()} onPieceDrop={onPieceDrop} theme={theme} boardWidth={boardWidth} />

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
            {chess.isGameOver() ? "Game over" : chess.turn() === "w" ? "White to move" : "Black to move"}
            {engineThinking ? ", engine thinking…" : ""}
          </span>
          <button onClick={undoMove} disabled={historySAN.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, color: historySAN.length ? textMuted : borderCol, borderRadius: 6, padding: "5px 9px", fontSize: 11.5, cursor: historySAN.length ? "pointer" : "not-allowed" }}>
            <Undo2 size={12} /> Undo
          </button>
          <button onClick={resetGame} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, color: textMuted, borderRadius: 6, padding: "5px 9px", fontSize: 11.5, cursor: "pointer" }}>
            <RotateCcw size={12} /> Reset
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShareOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, color: textMuted, borderRadius: 6, padding: "5px 9px", fontSize: 11.5, cursor: "pointer" }}>
              <Share2 size={12} /> Share
            </button>
            {shareOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 8, padding: 8, zIndex: 20, width: 170 }}>
                <button onClick={copyFEN} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "transparent", border: "none", color: textMain, fontSize: 12, padding: "6px 4px", cursor: "pointer", textAlign: "left" }}>
                  <Copy size={12} /> Copy position (FEN)
                </button>
                <button onClick={copyPGN} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "transparent", border: "none", color: textMain, fontSize: 12, padding: "6px 4px", cursor: "pointer", textAlign: "left" }}>
                  <Copy size={12} /> Copy full game (PGN)
                </button>
              </div>
            )}
          </div>
          {copyStatus && <span style={{ fontSize: 11, color: accentGold }}>{copyStatus}</span>}
        </div>

        {historySAN.length > 0 && (
          <div style={{ marginTop: 10, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 8, padding: "8px 10px", maxWidth: boardWidth, fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 2 }}>
            {historySAN.map((san, i) => (
              <span key={i}
                onClick={() => explainPly(i)}
                style={{ marginRight: 8, cursor: "pointer", color: selectedPly === i ? accentGold : textMuted, textDecoration: selectedPly === i ? "underline" : "none" }}
                title="Click to see the coach's take on this move">
                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ""}{san}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: "1 1 280px", minWidth: 260, maxWidth: 340, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <ModeBtn active={mode === "practice"} onClick={() => setMode("practice")} icon={<Users size={14} />} label="Practice" accentGold={accentGold} textMain={textMain} borderCol={borderCol} panelBg={panelBg} />
          <ModeBtn active={mode === "computer"} onClick={() => setMode("computer")} icon={<Bot size={14} />} label="vs Computer" accentGold={accentGold} textMain={textMain} borderCol={borderCol} panelBg={panelBg} />
        </div>

        {mode === "computer" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: textMuted, marginBottom: 7 }}>Difficulty</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DIFFICULTY_PRESETS.map((d) => (
                <button key={d.key} onClick={() => setDifficulty(d)}
                  style={{ padding: "5px 9px", borderRadius: 7, border: difficulty.key === d.key ? `1.5px solid ${accentGold}` : `1px solid ${borderCol}`, background: difficulty.key === d.key ? "rgba(226,105,75,0.12)" : "transparent", color: textMain, fontSize: 11.5, cursor: "pointer" }}>
                  {d.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: textMuted, marginTop: 8, lineHeight: 1.5 }}>
              Runs fully offline in your browser via Stockfish (WASM), no internet needed once the page has loaded.
            </p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <MessageCircle size={14} color={accentGold} />
          <span style={{ fontSize: 12, fontWeight: 600, color: textMain }}>Coach</span>
          {selectedPly !== null && <span style={{ fontSize: 10.5, color: textMuted }}>(move {Math.floor(selectedPly / 2) + 1}{selectedPly % 2 === 0 ? "" : "…"})</span>}
        </div>
        <div role="status" aria-live="polite" style={{ minHeight: 70, padding: "10px 12px", borderRadius: 8, background: coachMsg ? (coachMsg.tone === "warning" ? "rgba(224,91,91,0.1)" : "rgba(226,105,75,0.08)") : "transparent", border: `1px solid ${coachMsg?.tone === "warning" ? "#E05B5B" : borderCol}`, fontSize: 12.5, color: coachMsg ? textMain : textMuted, lineHeight: 1.5 }}>
          {coachMsg ? coachMsg.text : "Make a move and I'll point out anything worth noticing, or click any past move above to see the coach's take on it."}
        </div>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, icon, label, accentGold, textMain, borderCol, panelBg }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 10px", borderRadius: 7, border: active ? `1.5px solid ${accentGold}` : `1px solid ${borderCol}`, background: active ? "rgba(226,105,75,0.12)" : "transparent", color: active ? accentGold : textMain, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
      {icon} {label}
    </button>
  );
}
