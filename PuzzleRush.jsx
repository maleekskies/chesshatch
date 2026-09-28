import { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Zap, Trophy } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import { SAMPLE_PUZZLES } from "../data/lessons.js";
import { supabase } from "../lib/supabaseClient.js";

const RUSH_SECONDS = 90;

// Timed puzzle-solving streak, named directly in the blueprint's
// feature list. Honest scope: cycles through the small hand-verified
// SAMPLE_PUZZLES set (repeating in a shuffled order once exhausted)
// until the real Lichess puzzle import replaces it with a much larger
// pool, with only 2-3 puzzles, repeats will be quick to notice, but
// the mechanic itself (timer, streak, miss ends the run) is real.
export default function PuzzleRush({ session, theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone }) {
  const [stage, setStage] = useState("idle"); // idle | running | over
  const [puzzleQueue, setPuzzleQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RUSH_SECONDS);
  const [bestStreak, setBestStreak] = useState(0);
  const [flash, setFlash] = useState(null); // 'good' | 'bad' | null

  const chessRef = useRef(new Chess());
  const chess = chessRef.current;
  const [version, setVersion] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      supabase.from("puzzle_rush_scores").select("best_streak").eq("user_id", session.user.id).maybeSingle()
        .then(({ data }) => { if (data) setBestStreak(data.best_streak); });
    }
    return () => clearInterval(timerRef.current);
  }, [session]);

  function shuffledQueue() {
    const arr = [...SAMPLE_PUZZLES];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function loadPuzzle(index, queue) {
    const p = queue[index % queue.length];
    chess.load(p.fen);
    setVersion((v) => v + 1);
  }

  function start() {
    const queue = shuffledQueue();
    setPuzzleQueue(queue);
    setQueueIndex(0);
    setStreak(0);
    setSecondsLeft(RUSH_SECONDS);
    setStage("running");
    loadPuzzle(0, queue);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); endRun(); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  async function endRun() {
    setStage("over");
    if (session?.user) {
      const newBest = Math.max(bestStreak, streak);
      setBestStreak(newBest);
      await supabase.from("puzzle_rush_scores").upsert({
        user_id: session.user.id, best_streak: newBest, last_streak: streak, updated_at: new Date().toISOString(),
      });
    }
  }

  function onPieceDrop(from, to) {
    if (stage !== "running") return false;
    const puzzle = puzzleQueue[queueIndex % puzzleQueue.length];
    const move = chess.move({ from, to, promotion: "q" });
    if (!move) return false;
    setVersion((v) => v + 1);
    const uci = from + to;
    if (puzzle.solutionSquares.includes(uci)) {
      setStreak((s) => s + 1);
      setFlash("good");
      setTimeout(() => {
        setFlash(null);
        const next = queueIndex + 1;
        setQueueIndex(next);
        loadPuzzle(next, puzzleQueue);
      }, 350);
    } else {
      setFlash("bad");
      clearInterval(timerRef.current);
      setTimeout(() => endRun(), 500);
    }
    return true;
  }

  const boardWidth = isPhone ? Math.min(320, window.innerWidth - 48) : 400;

  if (stage === "idle") {
    return (
      <div style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Zap size={18} color={accentGold} />
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, margin: 0 }}>Puzzle Rush</h2>
        </div>
        <p style={{ color: textMuted, fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
          Solve as many puzzles as you can in {RUSH_SECONDS} seconds. One wrong move ends the run, go for streak, not speed alone.
        </p>
        {session?.user && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: textMuted, fontSize: 13 }}>
            <Trophy size={14} color={accentGold} /> Best streak: <span style={{ color: textMain, fontWeight: 600 }}>{bestStreak}</span>
          </div>
        )}
        <button onClick={start} style={{ background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Start Rush
        </button>
      </div>
    );
  }

  if (stage === "over") {
    return (
      <div style={{ maxWidth: 420 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Run over</h2>
        <p style={{ color: textMain, fontSize: 16, marginBottom: 4 }}>Streak: <strong style={{ color: accentGold }}>{streak}</strong></p>
        {session?.user && <p style={{ color: textMuted, fontSize: 13, marginBottom: 20 }}>Best: {bestStreak}</p>}
        {!session?.user && <p style={{ color: textMuted, fontSize: 12, marginBottom: 20 }}>Sign in to save your best streak.</p>}
        <button onClick={start} style={{ background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "11px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        {flash && (
          <div style={{ position: "absolute", inset: 0, background: flash === "good" ? "rgba(241,64,56,0.25)" : "rgba(224,91,91,0.3)", zIndex: 10, borderRadius: 4, pointerEvents: "none" }} />
        )}
        <ChessBoard fen={chess.fen()} onPieceDrop={onPieceDrop} theme={theme} boardWidth={boardWidth} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 140 }}>
        <div style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: "10px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: secondsLeft <= 10 ? "#E05B5B" : textMain }}>{secondsLeft}s</div>
          <div style={{ fontSize: 10.5, color: textMuted }}>time left</div>
        </div>
        <div style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: "10px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: accentGold }}>{streak}</div>
          <div style={{ fontSize: 10.5, color: textMuted }}>streak</div>
        </div>
      </div>
    </div>
  );
}
