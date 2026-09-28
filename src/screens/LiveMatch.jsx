import { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Copy, Users, Flag, Handshake, XCircle, MessageCircle } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import { generateMatchCode, joinMatchChannel, broadcastEvent } from "../lib/liveMatch.js";
import { TIME_CONTROLS } from "../lib/glicko2.js";
import { formatClock, isLowTime, msFromMinutes } from "../lib/clock.js";
import { applyRatingUpdate, saveOwnRating, getRating } from "../lib/ratings.js";
import { analyzeMove } from "../lib/coach.js";
import { supabase } from "../lib/supabaseClient.js";
import { giveMoveFeedback } from "../lib/moveFeedback.js";

// Real-time match between two signed-in testers, with time controls,
// clocks, resign/draw/abort, and Glicko-2 rating updates.
//
// See liveMatch.js and ratings.js for the two honest limitations worth
// knowing about: clocks aren't server-authoritative (client-only
// countdowns resynced on each move), and rating updates trust each
// client to report its own result rather than a server verifying it.
export default function LiveMatch({ session, theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onEarnBadge }) {
  const [stage, setStage] = useState("choose"); // choose | waiting | joining | playing | gameover
  const [tcCategory, setTcCategory] = useState(TIME_CONTROLS[1]); // default Blitz
  const [tcOption, setTcOption] = useState(TIME_CONTROLS[1].options[1]); // 5+0
  const [code, setCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [role, setRole] = useState(null); // 'w' | 'b'

  const chessRef = useRef(new Chess());
  const chess = chessRef.current;
  const [version, setVersion] = useState(0);
  const channelRef = useRef(null);
  const timeControlRef = useRef(null);

  const [whiteMs, setWhiteMs] = useState(0);
  const [blackMs, setBlackMs] = useState(0);
  const tickRef = useRef(null);

  const [drawOfferPending, setDrawOfferPending] = useState(false); // opponent offered, waiting on us
  const [drawOfferSent, setDrawOfferSent] = useState(false);
  const [gameResult, setGameResult] = useState(null); // { outcome: 'white'|'black'|'draw', reason }
  const [opponentRating, setOpponentRating] = useState(null);
  const [myRating, setMyRating] = useState(null);
  const [ratingApplied, setRatingApplied] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewNotes, setReviewNotes] = useState([]);

  const isPhoneW = isPhone;
  const boardWidth = isPhoneW ? Math.min(340, window.innerWidth - 48) : 460;

  useEffect(() => () => { channelRef.current?.unsubscribe(); clearInterval(tickRef.current); }, []);

  function applyIncrement(color) {
    const incMs = (timeControlRef.current?.incrementSec || 0) * 1000;
    if (!incMs) return;
    if (color === "w") setWhiteMs((m) => m + incMs);
    else setBlackMs((m) => m + incMs);
  }

  function applyRemoteMove({ from, to, promotion }) {
    chess.move({ from, to, promotion: promotion || undefined });
    giveMoveFeedback();
    applyIncrement(chess.turn() === "w" ? "b" : "w"); // color that just moved is the opposite of whose turn it now is
    setVersion((v) => v + 1);
    checkGameOverAfterMove();
  }

  function checkGameOverAfterMove() {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "black" : "white";
      endGame(winner, "checkmate");
    } else if (chess.isStalemate() || chess.isDraw()) {
      endGame("draw", "draw");
    }
  }

  async function endGame(outcome, reason) {
    setGameResult({ outcome, reason });
    setStage("gameover");
    clearInterval(tickRef.current);
    if (reason !== "abort") {
      onEarnBadge?.("first_live_match");
      if (reason === "checkmate" && ((outcome === "white" && role === "w") || (outcome === "black" && role === "b"))) {
        onEarnBadge?.("first_checkmate");
      }
    }
    if (reason === "abort") return; // no rating impact
    await settleRating(outcome);
  }

  async function settleRating(outcome) {
    if (ratingApplied || !session?.user) return;
    setRatingApplied(true);
    // Each client updates only its own rating row, computed against the
    // opponent's rating snapshot shared over broadcast, see the
    // honest limitation noted in ratings.js about client-only trust.
    if (!myRating || !opponentRating) return;
    const iAmWhite = role === "w";
    const myScore = outcome === "draw" ? 0.5 : (outcome === "white") === iAmWhite ? 1 : 0;
    const { updateRating } = await import("../lib/glicko2.js");
    const updated = updateRating(myRating.rating, myRating.rd, myRating.volatility, opponentRating.rating, opponentRating.rd, myScore);
    await saveOwnRating(session.user.id, timeControlRef.current.tcKey, updated, myRating.games_played || 0);
    setMyRating({ ...myRating, ...updated });
  }

  function startClockTick() {
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (chess.isGameOver()) return;
      const turn = chess.turn();
      if (turn === "w") {
        setWhiteMs((m) => {
          const next = m - 100;
          if (next <= 0) { handleTimeout("w"); return 0; }
          return next;
        });
      } else {
        setBlackMs((m) => {
          const next = m - 100;
          if (next <= 0) { handleTimeout("b"); return 0; }
          return next;
        });
      }
    }, 100);
  }

  function handleTimeout(colorThatRanOut) {
    // Only the player whose own clock this is reports the timeout.
    // avoids both sides racing to declare it.
    if (colorThatRanOut !== role) return;
    clearInterval(tickRef.current);
    const winner = colorThatRanOut === "w" ? "black" : "white";
    broadcastEvent(channelRef.current, "timeout", { loser: colorThatRanOut });
    endGame(winner, "timeout");
  }

  async function createMatch() {
    const newCode = generateMatchCode();
    setCode(newCode);
    setRole("w");
    setStage("waiting");
    timeControlRef.current = { ...tcOption, tcKey: tcCategory.key };
    setWhiteMs(msFromMinutes(tcOption.minutes));
    setBlackMs(msFromMinutes(tcOption.minutes));
    const rating = await loadMyRatingFor(tcCategory.key);

    channelRef.current = joinMatchChannel(newCode, {
      onMove: applyRemoteMove,
      onOpponentJoined: (payload) => {
        setOpponentRating(payload.rating);
        broadcastEvent(channelRef.current, "rating-share", { rating });
        setStage("playing");
        startClockTick();
      },
      onResign: ({ by }) => endGame(by === "w" ? "black" : "white", "resignation"),
      onDrawOffer: () => setDrawOfferPending(true),
      onDrawResponse: ({ accepted }) => { if (accepted) endGame("draw", "draw_agreed"); setDrawOfferSent(false); },
      onTimeout: ({ loser }) => endGame(loser === "w" ? "black" : "white", "timeout"),
    });
  }

  async function loadMyRatingFor(tcKey) {
    if (!session?.user) return null;
    const r = await getRating(session.user.id, tcKey);
    setMyRating(r);
    return r;
  }

  async function joinMatch() {
    if (!joinCodeInput.trim()) return;
    const joinCode = joinCodeInput.trim().toUpperCase();
    setCode(joinCode);
    setRole("b");
    setStage("playing");
    // Guest doesn't know the host's chosen time control in advance in
    // this simple v1, defaults to the same category/option currently
    // selected in the UI. Host and guest should agree on time control
    // out of band (e.g. "let's do 5+0 blitz") before sharing the code.
    timeControlRef.current = { ...tcOption, tcKey: tcCategory.key };
    setWhiteMs(msFromMinutes(tcOption.minutes));
    setBlackMs(msFromMinutes(tcOption.minutes));
    const rating = await loadMyRatingFor(tcCategory.key);

    channelRef.current = joinMatchChannel(joinCode, {
      onMove: applyRemoteMove,
      onResign: ({ by }) => endGame(by === "w" ? "black" : "white", "resignation"),
      onDrawOffer: () => setDrawOfferPending(true),
      onDrawResponse: ({ accepted }) => { if (accepted) endGame("draw", "draw_agreed"); setDrawOfferSent(false); },
      onTimeout: ({ loser }) => endGame(loser === "w" ? "black" : "white", "timeout"),
      onRatingShare: (payload) => { setOpponentRating(payload.rating); startClockTick(); },
    });
    setTimeout(() => {
      broadcastEvent(channelRef.current, "opponent-joined", { role: "b", rating });
    }, 500);
  }

  function onPieceDrop(from, to) {
    if (chess.turn() !== role || stage !== "playing") return false;
    const move = chess.move({ from, to, promotion: "q" });
    if (!move) return false;
    applyIncrement(role);
    setVersion((v) => v + 1);
    broadcastEvent(channelRef.current, "move", { from, to, promotion: "q" });
    checkGameOverAfterMove();
    return true;
  }

  function resign() {
    broadcastEvent(channelRef.current, "resign", { by: role });
    endGame(role === "w" ? "black" : "white", "resignation");
  }
  function offerDraw() {
    broadcastEvent(channelRef.current, "draw-offer", {});
    setDrawOfferSent(true);
  }
  function respondDraw(accepted) {
    broadcastEvent(channelRef.current, "draw-response", { accepted });
    setDrawOfferPending(false);
    if (accepted) endGame("draw", "draw_agreed");
  }
  function abortGame() {
    if (chess.history().length > 0) return; // only before any moves
    endGame(null, "abort");
  }

  function buildReview() {
    const historyVerbose = chess.history({ verbose: true });
    const replay = new Chess();
    const notes = [];
    historyVerbose.forEach((m, i) => {
      replay.move({ from: m.from, to: m.to, promotion: m.promotion || "q" });
      const msg = analyzeMove({
        board: replay.board(), moverColor: m.color, toSquare: m.to,
        isCheck: replay.isCheck(), isCheckmate: replay.isCheckmate(), isStalemate: replay.isStalemate(),
      });
      if (msg) notes.push({ ply: i, san: m.san, ...msg });
    });
    setReviewNotes(notes);
    setShowReview(true);
  }

  const myMs = role === "w" ? whiteMs : blackMs;
  const oppMs = role === "w" ? blackMs : whiteMs;

  if (!session?.user) {
    return <p style={{ color: textMuted, fontSize: 13.5 }}>Live Match needs an account. Accounts are switched off for now, so this screen isn't available yet.</p>;
  }

  if (stage === "choose") {
    return (
      <div style={{ maxWidth: 420 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Live Match</h2>
        <p style={{ color: textMuted, fontSize: 13, marginBottom: 20 }}>
          A real-time rated game against another signed-in tester, with a real clock.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: textMuted, marginBottom: 7 }}>Time control</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {TIME_CONTROLS.map((tc) => (
              <button key={tc.key} onClick={() => { setTcCategory(tc); setTcOption(tc.options[0]); }}
                style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: tcCategory.key === tc.key ? `1.5px solid ${accentGold}` : `1px solid ${borderCol}`, background: tcCategory.key === tc.key ? "rgba(226,105,75,0.12)" : "transparent", color: tcCategory.key === tc.key ? accentGold : textMain, fontSize: 12, cursor: "pointer" }}>
                {tc.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tcCategory.options.map((opt) => (
              <button key={opt.label} onClick={() => setTcOption(opt)}
                style={{ padding: "5px 10px", borderRadius: 6, border: tcOption.label === opt.label ? `1.5px solid ${accentGold}` : `1px solid ${borderCol}`, background: tcOption.label === opt.label ? "rgba(226,105,75,0.12)" : "transparent", color: textMain, fontSize: 12, cursor: "pointer" }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={createMatch} style={{ width: "100%", marginBottom: 10, background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Create a match
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="Enter code"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${borderCol}`, background: "transparent", color: textMain, fontSize: 14 }} />
          <button onClick={joinMatch} style={{ background: "transparent", border: `1px solid ${borderCol}`, color: textMain, borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer" }}>
            Join
          </button>
        </div>
        <p style={{ fontSize: 11, color: textMuted, marginTop: 14, lineHeight: 1.5 }}>
          Agree on the time control with your opponent before sharing the code, the joiner's own selection is used if it doesn't match.
        </p>
      </div>
    );
  }

  if (stage === "waiting") {
    return (
      <div style={{ maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={16} color={accentGold} />
          <span style={{ fontSize: 13.5, color: textMain }}>Waiting for an opponent… ({tcOption.label} {tcCategory.label})</span>
        </div>
        <div style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>Share this code:</div>
          <div style={{ fontSize: 28, fontFamily: "'IBM Plex Mono', monospace", color: accentGold, fontWeight: 600, letterSpacing: 2 }}>{code}</div>
          <button onClick={() => navigator.clipboard?.writeText(code)} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, color: textMuted, borderRadius: 6, padding: "5px 10px", fontSize: 11.5, cursor: "pointer" }}>
            <Copy size={11} /> Copy code
          </button>
        </div>
      </div>
    );
  }

  if (stage === "gameover") {
    const resultLabel = gameResult?.reason === "abort" ? "Match aborted"
      : gameResult?.outcome === "draw" ? "Draw"
      : `${gameResult?.outcome === "white" ? "White" : "Black"} wins by ${gameResult?.reason}`;
    return (
      <div style={{ maxWidth: 460 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{resultLabel}</h2>
        {myRating && opponentRating && gameResult?.reason !== "abort" && (
          <p style={{ color: textMuted, fontSize: 13, marginBottom: 16 }}>
            Your rating: {myRating.rating}{myRating.games_played !== undefined ? ` (${myRating.games_played + 1} games)` : ""}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={buildReview} style={{ display: "flex", alignItems: "center", gap: 6, background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <MessageCircle size={14} /> Review with coach
          </button>
          <button onClick={() => setStage("choose")} style={{ background: "transparent", border: `1px solid ${borderCol}`, color: textMain, borderRadius: 8, padding: "10px 14px", fontSize: 13, cursor: "pointer" }}>
            New match
          </button>
        </div>
        {showReview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewNotes.length === 0 && <p style={{ color: textMuted, fontSize: 13 }}>No moves flagged by the coach, a clean game.</p>}
            {reviewNotes.map((n) => (
              <div key={n.ply} style={{ padding: "9px 12px", borderRadius: 8, background: n.tone === "warning" ? "rgba(224,91,91,0.1)" : "rgba(226,105,75,0.08)", border: `1px solid ${n.tone === "warning" ? "#E05B5B" : borderCol}`, fontSize: 12.5, color: textMain }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: accentGold, marginRight: 6 }}>{n.san}</span>
                {n.text}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // stage === "playing"
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
      <div>
        <ClockDisplay label="Opponent" ms={oppMs} active={chess.turn() !== role} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} />
        <div style={{ margin: "8px 0" }}>
          <ChessBoard fen={chess.fen()} onPieceDrop={onPieceDrop} theme={theme} boardWidth={boardWidth} boardOrientation={role === "b" ? "black" : "white"} />
        </div>
        <ClockDisplay label="You" ms={myMs} active={chess.turn() === role} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} />
      </div>

      <div style={{ flex: "1 1 220px", minWidth: 220, maxWidth: 280 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 14, fontFamily: "'IBM Plex Mono', monospace" }}>
          {tcOption.label} {tcCategory.label}, playing as {role === "w" ? "White" : "Black"}
        </div>

        {drawOfferPending && (
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(226,105,75,0.1)", border: `1px solid ${accentGold}`, marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, color: textMain, marginBottom: 8 }}>Opponent offers a draw</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => respondDraw(true)} style={{ flex: 1, background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Accept</button>
              <button onClick={() => respondDraw(false)} style={{ flex: 1, background: "transparent", border: `1px solid ${borderCol}`, color: textMain, borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>Decline</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {chess.history().length === 0 && (
            <ControlBtn onClick={abortGame} icon={<XCircle size={13} />} label="Abort" textMain={textMain} borderCol={borderCol} />
          )}
          <ControlBtn onClick={offerDraw} disabled={drawOfferSent} icon={<Handshake size={13} />} label={drawOfferSent ? "Draw offered…" : "Offer draw"} textMain={textMain} borderCol={borderCol} />
          <ControlBtn onClick={resign} icon={<Flag size={13} />} label="Resign" textMain={textMain} borderCol={borderCol} danger />
        </div>
      </div>
    </div>
  );
}

function ClockDisplay({ label, ms, active, textMain, textMuted, panelBg, borderCol, accentGold }) {
  const low = isLowTime(ms);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: active ? "rgba(226,105,75,0.1)" : panelBg, border: `1px solid ${active ? accentGold : borderCol}` }}>
      <span style={{ fontSize: 11.5, color: textMuted }}>{label}</span>
      <span style={{ fontSize: 20, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: low ? "#E05B5B" : textMain }}>
        {formatClock(ms)}
      </span>
    </div>
  );
}

function ControlBtn({ onClick, icon, label, textMain, borderCol, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 7, border: `1px solid ${danger ? "#E05B5B" : borderCol}`, background: "transparent", color: danger ? "#E05B5B" : textMain, fontSize: 12.5, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      {icon} {label}
    </button>
  );
}
