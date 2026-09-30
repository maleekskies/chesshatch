import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Bot, Check, ChevronLeft, Lock, RotateCcw, Trophy } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import PromotionPicker from "../components/PromotionPicker.jsx";
import { createEngine } from "../lib/stockfish.js";
import { giveMoveFeedback } from "../lib/moveFeedback.js";
import { BOT_LADDER, PLAYER_COLOR, outcomeOf, readUnlockedCount, writeUnlockedCount, resetBotProgress } from "../lib/botLadder.js";
import { useViewport, fitBoard } from "../lib/boardSize.js";

// The bot progression screen behind the "Intermediate" section.
//
// Everything here is played on the same two pieces of chess logic the
// rest of the app already uses: chess.js decides what is legal (an
// illegal move simply isn't accepted, and an illegal engine suggestion
// is discarded rather than played), and the offline Stockfish worker
// picks the bot's replies. The board is the same ChessBoard wrapper
// used by Play/Lessons, so tapping, dragging, snap-back on an illegal
// drop and promotion all behave identically here.
//
// On the ladder itself: progress is a count of unlocked rungs, so a
// level can only be reached by winning the one before it. Selecting a
// locked level is not possible, the button isn't rendered.
export default function Bots({ theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onBack, onEarnBadge }) {
  const { width: viewportW, height: viewportH } = useViewport();

  const [unlockedCount, setUnlockedCount] = useState(() => readUnlockedCount());
  const [activeKey, setActiveKey] = useState(null); // null = showing the ladder
  const [fen, setFen] = useState(null);
  const [engineThinking, setEngineThinking] = useState(false);
  const [outcome, setOutcome] = useState(null); // null | { type, unlocked }
  const [pendingPromotion, setPendingPromotion] = useState(null); // { from, to } | null

  const chessRef = useRef(null);
  const engineRef = useRef(null);
  const activeKeyRef = useRef(null);
  const unlockedRef = useRef(unlockedCount);
  unlockedRef.current = unlockedCount;

  useEffect(() => () => {
    if (engineRef.current) { engineRef.current.destroy(); engineRef.current = null; }
  }, []);

  // Award the next rung, once, and only if the player is actually at
  // the frontier. Replaying and beating an easier level again does not
  // push progress forward a second time.
  function grantUnlock(index, nextKey) {
    if (!nextKey || index + 1 < unlockedRef.current) return null;
    unlockedRef.current = writeUnlockedCount(index + 2);
    setUnlockedCount(unlockedRef.current);
    return nextKey;
  }

  function settle(chess) {
    const type = outcomeOf(chess);
    if (!type) return;
    const index = BOT_LADDER.findIndex((l) => l.key === activeKeyRef.current);
    const next = BOT_LADDER[index + 1] || null;
    if (type === "win") {
      onEarnBadge?.("first_checkmate");
      onEarnBadge?.("first_game");
      setOutcome({ type: "win", unlocked: grantUnlock(index, next?.key) });
      return;
    }
    onEarnBadge?.("first_game");
    setOutcome({ type, unlocked: null });
  }

  const requestEngineMove = useCallback((level) => {
    const chess = chessRef.current;
    if (!engineRef.current || !chess || chess.isGameOver()) return;
    setEngineThinking(true);
    engineRef.current.getBestMove(chess.fen(), { moveTimeMs: level.moveTimeMs }).then((uci) => {
      // The game may have been restarted or left while the engine was
      // thinking; drop the reply instead of applying it to a new game.
      if (chessRef.current !== chess) return;
      setEngineThinking(false);
      if (!uci || uci === "(none)") return;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.slice(4, 5) || undefined;
      let moved = null;
      try {
        moved = chess.move({ from, to, promotion: promotion || "q" });
      } catch {
        moved = null;
      }
      if (!moved) return; // never play a move chess.js rejects
      giveMoveFeedback();
      setFen(chess.fen());
      settle(chess);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startGame(levelKey) {
    const index = BOT_LADDER.findIndex((l) => l.key === levelKey);
    if (index < 0 || index >= unlockedCount) return; // locked levels cannot be selected
    const level = BOT_LADDER[index];
    const chess = new Chess();
    chessRef.current = chess;
    activeKeyRef.current = levelKey;
    setActiveKey(levelKey);
    setFen(chess.fen());
    setOutcome(null);
    setPendingPromotion(null);
    setEngineThinking(false);
    if (!engineRef.current) engineRef.current = createEngine();
    engineRef.current.setSkillLevel(level.skillLevel);
  }

  function leaveGame() {
    chessRef.current = null;
    activeKeyRef.current = null;
    setActiveKey(null);
    setFen(null);
    setOutcome(null);
    setPendingPromotion(null);
    setEngineThinking(false);
  }

  function isPromotionMove(from, to) {
    const chess = chessRef.current;
    if (!chess) return false;
    const piece = chess.get(from);
    if (!piece || piece.type !== "p" || piece.color !== PLAYER_COLOR) return false;
    return to[1] === "8";
  }

  function completeMove(from, to, promotion) {
    const chess = chessRef.current;
    if (!chess || outcome || chess.turn() !== PLAYER_COLOR) return false;
    const move = chess.move({ from, to, promotion: promotion || undefined });
    if (!move) return false;
    setFen(chess.fen());
    if (chess.isGameOver()) {
      settle(chess);
      return true;
    }
    const level = BOT_LADDER.find((l) => l.key === activeKeyRef.current);
    if (level) setTimeout(() => requestEngineMove(level), 250);
    return true;
  }

  function onPieceDrop(from, to) {
    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
      return true; // PromotionPicker resolves the real move
    }
    return completeMove(from, to, null);
  }

  function resolvePromotion(pieceKey) {
    if (!pendingPromotion) return;
    completeMove(pendingPromotion.from, pendingPromotion.to, pieceKey);
    setPendingPromotion(null);
  }

  const activeLevel = BOT_LADDER.find((l) => l.key === activeKey) || null;
  const activeIndex = activeLevel ? BOT_LADDER.indexOf(activeLevel) : -1;

  // ------------------------------------------------------------------ game ----
  if (activeLevel && fen) {
    const boardWidth = isPhone
      ? fitBoard({ viewportW, viewportH, max: 340, reserveW: 48, reserveH: 230 })
      : fitBoard({ viewportW, viewportH, max: 520, min: 320, reserveW: 420, reserveH: 270 });

    const finished = !!outcome;
    const status = finished
      ? outcome.type === "win" ? "You won" : outcome.type === "loss" ? `${activeLevel.name} won` : "Draw"
      : engineThinking ? `${activeLevel.name} is thinking…` : "Your move, you play White";
    const nextLevel = BOT_LADDER[activeIndex + 1] || null;

    return (
      <div>
        <button onClick={leaveGame} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 14, padding: 0 }}>
          <ChevronLeft size={13} /> Back to levels
        </button>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" }}>
          <div style={{ flex: "0 0 auto", position: "relative" }}>
            {pendingPromotion && (
              <PromotionPicker onPick={resolvePromotion} panelBg={panelBg} borderCol={borderCol} textMain={textMain} accentGold={accentGold} />
            )}
            <ChessBoard
              fen={fen}
              onPieceDrop={onPieceDrop}
              theme={theme}
              boardWidth={boardWidth}
              arePiecesDraggable={!finished && !engineThinking && !pendingPromotion}
            />
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, color: textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>{status}</span>
              <button onClick={() => startGame(activeLevel.key)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, color: textMuted, borderRadius: 6, padding: "5px 9px", fontSize: 11.5, cursor: "pointer" }}>
                <RotateCcw size={12} /> Restart
              </button>
            </div>
          </div>

          <div style={{ flex: "1 1 280px", minWidth: 260, maxWidth: 320, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Bot size={15} color={accentGold} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: textMain }}>vs {activeLevel.name}</span>
            </div>
            <div style={{ fontSize: 11.5, color: textMuted, lineHeight: 1.6, marginBottom: 14 }}>
              Level {activeIndex + 1} of {BOT_LADDER.length}. Win this game to unlock{" "}
              {nextLevel ? nextLevel.name : "the top of the ladder"}.
            </div>

            {finished ? (
              <div role="status" aria-live="polite" style={{ border: `1px solid ${outcome.type === "win" ? accentGold : borderCol}`, background: outcome.type === "win" ? "rgba(226,105,75,0.08)" : "transparent", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: textMain, marginBottom: 6 }}>
                  {outcome.type === "win" ? `You beat ${activeLevel.name}.` : outcome.type === "loss" ? `${activeLevel.name} won this one.` : "Draw."}
                </div>
                <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.6, margin: 0 }}>
                  {outcome.type === "win" && outcome.unlocked
                    ? `${BOT_LADDER.find((l) => l.key === outcome.unlocked).name} is now unlocked.`
                    : outcome.type === "win"
                      ? "You already had this level unlocked, so nothing new opened up."
                      : "No level changes hands on a draw or a loss. Try again whenever you're ready."}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {outcome.type === "win" && outcome.unlocked && (
                    <button onClick={() => startGame(outcome.unlocked)}
                      style={{ background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                      Play {BOT_LADDER.find((l) => l.key === outcome.unlocked).name}
                    </button>
                  )}
                  <button onClick={() => startGame(activeLevel.key)}
                    style={{ background: "transparent", border: `1px solid ${borderCol}`, color: textMain, borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    {outcome.type === "win" ? "Play again" : "Try again"}
                  </button>
                  <button onClick={leaveGame}
                    style={{ background: "transparent", border: `1px solid ${borderCol}`, color: textMuted, borderRadius: 8, padding: "9px 14px", fontSize: 12.5, cursor: "pointer" }}>
                    Back to levels
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.6, margin: 0 }}>
                The bot runs entirely in your browser (offline Stockfish), so this works without a connection once the page has loaded. Both sides play legal chess: an illegal move is never accepted.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- ladder ----
  const topLevel = BOT_LADDER[unlockedCount - 1];

  return (
    <div style={{ maxWidth: 760 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={13} /> Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(226,105,75,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Trophy size={18} color={accentGold} />
        </div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: isPhone ? 21 : 25, fontWeight: 700, margin: 0 }}>
          Intermediate
        </h2>
      </div>
      <p style={{ color: textMuted, fontSize: 13.5, lineHeight: 1.6, margin: "0 0 5px", maxWidth: 560 }}>
        Bot ranking and progression. You start at Beginner, and every win against
        your current level unlocks the next one. Nine levels, in order, no skipping.
      </p>
      <p style={{ color: textMuted, fontSize: 11.5, lineHeight: 1.6, margin: "0 0 22px", maxWidth: 620 }}>
        These are game progression names, not real playing strength or official FIDE
        ratings and titles. Beating the Grandmaster level here means beating this
        app's hardest bot setting, nothing more.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: textMain, fontWeight: 600 }}>
          {unlockedCount} of {BOT_LADDER.length} unlocked
        </span>
        <span style={{ fontSize: 11.5, color: textMuted }}>· currently at {topLevel.name}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {BOT_LADDER.map((level, i) => {
          const unlocked = i < unlockedCount;
          const isCurrent = i === unlockedCount - 1;
          return (
            <div key={level.key} style={{
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              background: panelBg, border: `1px solid ${isCurrent ? accentGold : borderCol}`,
              borderRadius: 12, padding: isPhone ? "12px 14px" : "14px 18px",
              opacity: unlocked ? 1 : 0.62,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0, fontSize: 11.5, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: unlocked ? accentGold : "transparent",
                border: `1.5px solid ${unlocked ? accentGold : borderCol}`,
                color: unlocked ? "#FFFFFF" : textMuted,
              }}>
                {unlocked ? <Check size={13} /> : i + 1}
              </div>

              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: textMain }}>{level.name}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: accentGold, border: `1px solid ${accentGold}`, borderRadius: 20, padding: "2px 8px" }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                  {unlocked
                    ? "Available to play"
                    : `Locked — win the ${BOT_LADDER[i - 1].name} level to unlock`}
                </div>
              </div>

              {unlocked ? (
                <button onClick={() => startGame(level.key)}
                  style={{ background: isCurrent ? accentGold : "transparent", color: isCurrent ? "#FFFFFF" : textMain, border: isCurrent ? "none" : `1px solid ${borderCol}`, borderRadius: 10, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Bot size={14} /> Play Bot
                </button>
              ) : (
                <span title="Locked" style={{ display: "flex", alignItems: "center", gap: 6, color: textMuted, fontSize: 11.5, padding: "9px 4px" }}>
                  <Lock size={14} /> Locked
                </span>
              )}
            </div>
          );
        })}
      </div>

      {unlockedCount > 1 && (
        <button
          onClick={() => { resetBotProgress(); unlockedRef.current = 1; setUnlockedCount(1); }}
          style={{ background: "transparent", border: "none", color: textMuted, fontSize: 11.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, marginTop: 18, padding: 0 }}>
          Reset progression back to Beginner
        </button>
      )}
    </div>
  );
}
