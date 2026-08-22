import { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Copy, Users } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import { generateMatchCode, joinMatchChannel, sendMove } from "../lib/liveMatch.js";

// Real-time match between two signed-in testers. See the flag in
// liveMatch.js — this is the least-verified feature in the build,
// since two-client sync can't be tested from a single sandbox session.
export default function LiveMatch({ session, theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone }) {
  const [stage, setStage] = useState("choose"); // choose | waiting | joining | playing
  const [code, setCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [role, setRole] = useState(null); // 'w' | 'b'
  const [opponentJoined, setOpponentJoined] = useState(false);
  const chessRef = useRef(new Chess());
  const chess = chessRef.current;
  const [version, setVersion] = useState(0);
  const channelRef = useRef(null);

  useEffect(() => () => { channelRef.current?.unsubscribe(); }, []);

  function applyRemoteMove({ from, to, promotion }) {
    chess.move({ from, to, promotion: promotion || undefined });
    setVersion((v) => v + 1);
  }

  function createMatch() {
    const newCode = generateMatchCode();
    setCode(newCode);
    setRole("w");
    setStage("waiting");
    channelRef.current = joinMatchChannel(newCode, {
      onMove: applyRemoteMove,
      onOpponentJoined: () => { setOpponentJoined(true); setStage("playing"); },
    });
  }

  function joinMatch() {
    if (!joinCodeInput.trim()) return;
    const joinCode = joinCodeInput.trim().toUpperCase();
    setCode(joinCode);
    setRole("b");
    setStage("playing");
    setOpponentJoined(true);
    channelRef.current = joinMatchChannel(joinCode, { onMove: applyRemoteMove });
    // Give the channel a moment to subscribe before announcing — Realtime
    // needs the subscription acknowledged first.
    setTimeout(() => {
      channelRef.current?.send({ type: "broadcast", event: "opponent-joined", payload: { role: "b" } });
    }, 500);
  }

  function onPieceDrop(from, to) {
    if (chess.turn() !== role) return false; // not your turn
    const move = chess.move({ from, to, promotion: "q" });
    if (!move) return false;
    setVersion((v) => v + 1);
    sendMove(channelRef.current, { from, to, promotion: "q" });
    return true;
  }

  const boardWidth = isPhone ? Math.min(340, window.innerWidth - 48) : 420;

  if (!session?.user) {
    return <p style={{ color: textMuted, fontSize: 13.5 }}>Sign in to play a live match against another tester.</p>;
  }

  if (stage === "choose") {
    return (
      <div style={{ maxWidth: 400 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Live Match</h2>
        <p style={{ color: textMuted, fontSize: 13, marginBottom: 20 }}>
          Play a real-time game against another signed-in tester. Least-tested feature in this build — if something looks off, that's exactly the feedback we need.
        </p>
        <button onClick={createMatch} style={{ width: "100%", marginBottom: 10, background: accentGold, color: "#1B2430", border: "none", borderRadius: 8, padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Create a match
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="Enter code"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${borderCol}`, background: "transparent", color: textMain, fontSize: 14 }} />
          <button onClick={joinMatch} style={{ background: "transparent", border: `1px solid ${borderCol}`, color: textMain, borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer" }}>
            Join
          </button>
        </div>
      </div>
    );
  }

  if (stage === "waiting") {
    return (
      <div style={{ maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={16} color={accentGold} />
          <span style={{ fontSize: 13.5, color: textMain }}>Waiting for an opponent…</span>
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

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 12.5, color: textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
        Playing as {role === "w" ? "White" : "Black"} — code {code} — {chess.turn() === role ? "your move" : "opponent's move"}
      </div>
      <ChessBoard fen={chess.fen()} onPieceDrop={onPieceDrop} theme={theme} boardWidth={boardWidth} boardOrientation={role === "b" ? "black" : "white"} />
    </div>
  );
}
