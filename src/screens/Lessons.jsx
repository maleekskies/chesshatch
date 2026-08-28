import { useState, useRef, useMemo, useEffect } from "react";
import { Chess } from "chess.js";
import { ChevronLeft, CheckCircle2, Lightbulb, Clock } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import Term from "../components/Term.jsx";
import { TIER1_LESSONS, TIER2_LESSONS, SAMPLE_PUZZLES } from "../data/lessons.js";
import { GLOSSARY } from "../data/glossary.js";
import { nextReview } from "../lib/spacedRepetition.js";
import { supabase } from "../lib/supabaseClient.js";

// Builds a Chess instance from a FEN without ever throwing. A bad FEN
// (malformed data, a missing king, anything chess.js's own validator
// rejects) previously crashed this whole screen and, since there was
// no boundary between here and the app root, took down the entire app
// with a raw "Invalid FEN" error. Content data should never have that
// much power over the app's stability, so this always returns a
// working board: the requested position if it's valid, or a plain
// starting position (with a console warning, so a real content bug is
// still visible to whoever's testing) if it isn't.
function safeChess(fen) {
  try {
    return new Chess(fen);
  } catch (err) {
    console.warn(`Invalid FEN, falling back to the starting position: ${fen}`, err);
    return new Chess();
  }
}

function safeLoad(chess, fen) {
  try {
    chess.load(fen);
  } catch (err) {
    console.warn(`Invalid FEN on reload, falling back to the starting position: ${fen}`, err);
    chess.reset();
  }
}

// Renders lesson explanation text, auto-linking any glossary word it
// contains to a hover/tap definition, so "opposition" or "fork" is
// explained the moment it's used, not just assumed knowledge.
function ExplanationText({ text, ...termProps }) {
  const words = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <p style={{ color: termProps.textMuted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>
      {parts.map((part, i) => {
        const lower = part.toLowerCase();
        if (GLOSSARY[lower]) return <Term key={i} word={part} {...termProps} />;
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export default function Lessons({ theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onLessonComplete, completedIds, session, autoOpenFirstLesson, onShowMistakes, onShowGlossary, onEarnBadge }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [reviewPuzzle, setReviewPuzzle] = useState(null); // set when opening from "due for review"
  const [dueReviews, setDueReviews] = useState([]);
  const [activeTier, setActiveTier] = useState(1);
  const lessonsForTier = activeTier === 1 ? TIER1_LESSONS : TIER2_LESSONS;

  // Zero-knowledge entry point: someone who has never played before can
  // skip the diagnostic and the lesson list entirely and land straight
  // in Tier 1, Lesson 1. Only runs once, on mount, this component
  // remounts fresh each time the "Never played before?" button is
  // clicked from the landing page, so it won't re-trigger on ordinary
  // "Lessons" nav clicks later in the same visit.
  useEffect(() => {
    if (autoOpenFirstLesson && TIER1_LESSONS.length > 0) {
      setActiveTier(1);
      setActiveLesson(TIER1_LESSONS[0]);
      setShowPuzzle(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session?.user) { setDueReviews([]); return; }
    supabase
      .from("puzzle_attempts")
      .select("puzzle_id, next_review_at, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const latestByPuzzle = {};
        for (const row of data) {
          if (!latestByPuzzle[row.puzzle_id]) latestByPuzzle[row.puzzle_id] = row;
        }
        const now = new Date();
        const due = Object.values(latestByPuzzle)
          .filter((r) => new Date(r.next_review_at) <= now)
          .map((r) => SAMPLE_PUZZLES.find((p) => p.id === r.puzzle_id))
          .filter(Boolean);
        setDueReviews(due);
      });
  }, [session]);

  const categories = useMemo(() => {
    const byCat = {};
    for (const l of lessonsForTier) {
      byCat[l.category] = byCat[l.category] || { total: 0, done: 0 };
      byCat[l.category].total += 1;
      if (completedIds.has(l.id)) byCat[l.category].done += 1;
    }
    return byCat;
  }, [completedIds, activeTier]);

  const termProps = { textMain, accentGold, panelBg, borderCol, textMuted };

  if (reviewPuzzle) {
    return (
      <PuzzleView
        puzzle={reviewPuzzle}
        theme={theme} textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} isPhone={isPhone}
        session={session} onEarnBadge={onEarnBadge}
        onBack={() => { setReviewPuzzle(null); setDueReviews((d) => d.filter((p) => p.id !== reviewPuzzle.id)); }}
      />
    );
  }

  if (!activeLesson) {
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
          {[1, 2].map((t) => (
            <button key={t} onClick={() => setActiveTier(t)}
              style={{ padding: "7px 14px", borderRadius: 8, border: activeTier === t ? `1.5px solid ${accentGold}` : `1px solid ${borderCol}`, background: activeTier === t ? "rgba(201,162,39,0.12)" : "transparent", color: activeTier === t ? accentGold : textMain, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Tier {t}
            </button>
          ))}
          {onShowMistakes && (
            <button onClick={onShowMistakes} style={{ marginLeft: "auto", background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Common beginner mistakes →
            </button>
          )}
          {onShowGlossary && (
            <button onClick={onShowGlossary} style={{ background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Glossary →
            </button>
          )}
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isPhone ? 22 : 26, fontWeight: 700, margin: "0 0 6px" }}>
          {activeTier === 1 ? "Tier 1. Complete Beginner" : "Tier 2. Intermediate"}
        </h2>
        <p style={{ color: textMuted, fontSize: 13.5, marginBottom: 18, maxWidth: 520 }}>
          {activeTier === 1
            ? "Start here if you're new to chess. Each lesson ends with a puzzle to lock in what you just learned."
            : "Once the basics are solid, deeper tactics and the positional ideas that separate a casual player from a strong one."}
        </p>

        {/* Mastery per category */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          {Object.entries(categories).map(([cat, c]) => (
            <div key={cat} style={{ flex: "1 1 150px", background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>{cat}</div>
              <div style={{ height: 6, background: borderCol, borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
                <div style={{ height: "100%", width: `${(c.done / c.total) * 100}%`, background: accentGold }} />
              </div>
              <div style={{ fontSize: 10.5, color: textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>{c.done}/{c.total} mastered</div>
            </div>
          ))}
        </div>

        {/* Spaced repetition: due for review */}
        {dueReviews.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Clock size={14} color={accentGold} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: textMain }}>Due for review</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dueReviews.map((p) => (
                <button key={p.id} onClick={() => setReviewPuzzle(p)}
                  style={{ textAlign: "left", padding: "10px 14px", borderRadius: 8, border: `1px solid ${accentGold}`, background: "rgba(201,162,39,0.08)", color: textMain, fontSize: 13, cursor: "pointer" }}>
                  Review: {p.motif} puzzle
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lessonsForTier.map((lesson, i) => {
            const done = completedIds.has(lesson.id);
            return (
              <button key={lesson.id} onClick={() => { setActiveLesson(lesson); setShowPuzzle(false); }}
                style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "14px 16px", borderRadius: 10, border: `1px solid ${borderCol}`, background: panelBg, cursor: "pointer" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: done ? accentGold : "transparent", border: `1.5px solid ${done ? accentGold : borderCol}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11.5, color: done ? "#1B2430" : textMuted, fontWeight: 600 }}>
                  {done ? <CheckCircle2 size={15} /> : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: textMain }}>{lesson.title}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{lesson.category}, {lesson.explanation.slice(0, 55)}…</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <LessonView
      key={activeLesson.id}
      lesson={activeLesson}
      theme={theme} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone}
      session={session}
      onBack={() => setActiveLesson(null)}
      onComplete={() => { onLessonComplete(activeLesson.id); setShowPuzzle(true); }}
      showPuzzle={showPuzzle}
      termProps={termProps}
      onEarnBadge={onEarnBadge}
    />
  );
}

function LessonView({ lesson, theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, session, onBack, onComplete, showPuzzle, termProps, onEarnBadge }) {
  if (lesson.qa) {
    return (
      <QAView
        lesson={lesson}
        theme={theme} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone}
        onBack={onBack}
        onComplete={onComplete}
        termProps={termProps}
      />
    );
  }

  const chessRef = useRef(safeChess(lesson.fen));
  const chess = chessRef.current;
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);

  const puzzle = useMemo(() => SAMPLE_PUZZLES.find((p) => p.motif === "fork" || p.motif === "hanging piece"), []);

  function onPieceDrop(from, to) {
    const move = chess.move({ from, to, promotion: "q" });
    if (!move) return false;
    setVersion((v) => v + 1);

    if (lesson.freePlay) return true;

    const uci = from + to;
    const correct = lesson.solutionSquares.includes(uci);
    if (correct) {
      setFeedback({ good: true, text: lesson.goal === "checkmate" ? "That's checkmate, well spotted." : "That's it, exactly right." });
      setSolved(true);
    } else {
      setFeedback({ good: false, text: "Not quite, try again, or use the hint below." });
      setTimeout(() => { safeLoad(chess, lesson.fen); setVersion((v) => v + 1); }, 900);
    }
    return true;
  }

  const boardWidth = isPhone ? Math.min(320, window.innerWidth - 48) : 440;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={15} /> All lessons
      </button>

      {!showPuzzle ? (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          <div>
            <ChessBoard fen={chess.fen()} onPieceDrop={onPieceDrop} theme={theme} boardWidth={boardWidth} />
          </div>
          <div style={{ flex: "1 1 240px", minWidth: 240, maxWidth: 340 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, margin: "0 0 10px" }}>{lesson.title}</h2>
            <ExplanationText text={lesson.explanation} {...termProps} />

            {feedback && (
              <div style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 12, background: feedback.good ? "rgba(201,162,39,0.1)" : "rgba(224,91,91,0.1)", border: `1px solid ${feedback.good ? accentGold : "#E05B5B"}`, fontSize: 13, color: textMain }}>
                {feedback.text}
              </div>
            )}

            {lesson.freePlay && (
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Free play, move the piece around, no wrong answers here.</div>
            )}

            {!lesson.freePlay && lesson.hint && (
              <button onClick={() => setShowHint((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${borderCol}`, color: textMuted, borderRadius: 7, padding: "7px 10px", fontSize: 12, cursor: "pointer", marginBottom: 10 }}>
                <Lightbulb size={13} /> {showHint ? "Hide hint" : "Show hint"}
              </button>
            )}
            {showHint && <p style={{ fontSize: 12.5, color: accentGold, marginBottom: 12 }}>{lesson.hint}</p>}

            <button
              onClick={onComplete}
              disabled={!lesson.freePlay && !solved}
              style={{ width: "100%", background: (lesson.freePlay || solved) ? accentGold : borderCol, color: (lesson.freePlay || solved) ? "#1B2430" : textMuted, border: "none", borderRadius: 8, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: (lesson.freePlay || solved) ? "pointer" : "not-allowed" }}
            >
              {lesson.freePlay ? "Got it, continue" : solved ? "Continue to puzzle" : "Solve it first"}
            </button>
          </div>
        </div>
      ) : (
        <PuzzleView puzzle={puzzle} theme={theme} textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} isPhone={isPhone} session={session} onBack={onBack} onEarnBadge={onEarnBadge} />
      )}
    </div>
  );
}

// A direct question-and-answer lesson, for rules that are hard to
// teach through free movement on a board (en passant, promotion
// choices, draw rules) but need a clear, direct explanation instead.
// The board is optional and, when present, purely illustrative: it
// isn't draggable, since there's nothing to solve here.
function QAView({ lesson, theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, onBack, onComplete, termProps }) {
  const [revealed, setRevealed] = useState(false);
  const boardWidth = isPhone ? Math.min(300, window.innerWidth - 48) : 360;

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 14, padding: 0 }}>
        <ChevronLeft size={15} /> All lessons
      </button>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {lesson.fen && (
          <div>
            <ChessBoard fen={lesson.fen} theme={theme} boardWidth={boardWidth} arePiecesDraggable={false} />
          </div>
        )}
        <div style={{ flex: "1 1 260px", minWidth: 260, maxWidth: 380 }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: accentGold, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
            Question
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, margin: "0 0 16px", lineHeight: 1.4 }}>
            {lesson.question}
          </h2>

          {!revealed ? (
            <button onClick={() => setRevealed(true)} style={{ width: "100%", background: accentGold, color: "#1B2430", border: "none", borderRadius: 8, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
              Show the answer
            </button>
          ) : (
            <div style={{ padding: "12px 14px", borderRadius: 8, marginBottom: 16, background: "rgba(201,162,39,0.08)", border: `1px solid ${accentGold}` }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: accentGold, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                Answer
              </div>
              <ExplanationText text={lesson.answer} {...termProps} />
            </div>
          )}

          <button
            onClick={() => { onComplete(); onBack(); }}
            disabled={!revealed}
            style={{ width: "100%", background: revealed ? accentGold : borderCol, color: revealed ? "#1B2430" : textMuted, border: "none", borderRadius: 8, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: revealed ? "pointer" : "not-allowed" }}
          >
            {revealed ? "Got it, continue" : "Show the answer first"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PuzzleView({ puzzle, theme, textMain, textMuted, accentGold, borderCol, isPhone, session, onBack, onEarnBadge }) {
  const chessRef = useRef(safeChess(puzzle.fen));
  const chess = chessRef.current;
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);

  const boardWidth = isPhone ? Math.min(320, window.innerWidth - 48) : 440;

  async function recordAttempt(correct) {
    if (!session?.user) return;
    // Look up the most recent prior attempt for this puzzle to base the
    // next interval on (spaced repetition needs the previous state).
    const { data } = await supabase
      .from("puzzle_attempts")
      .select("interval_days, ease")
      .eq("user_id", session.user.id)
      .eq("puzzle_id", puzzle.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const prior = data?.[0];
    const { ease, intervalDays, nextReviewAt } = nextReview({
      wasCorrect: correct,
      previousIntervalDays: prior?.interval_days || 1,
      previousEase: prior?.ease || 2.3,
    });
    await supabase.from("puzzle_attempts").insert({
      user_id: session.user.id,
      puzzle_id: puzzle.id,
      motif: puzzle.motif,
      correct,
      next_review_at: nextReviewAt,
      interval_days: intervalDays,
      ease,
    });
  }

  function onPieceDrop(from, to) {
    const move = chess.move({ from, to, promotion: "q" });
    if (!move) return false;
    setVersion((v) => v + 1);
    const uci = from + to;
    const correct = puzzle.solutionSquares.includes(uci);
    recordAttempt(correct);
    if (correct) {
      setResult({ good: true });
      onEarnBadge?.("first_puzzle");
    } else {
      setResult({ good: false });
      setTimeout(() => { safeLoad(chess, puzzle.fen); setVersion((v) => v + 1); setResult(null); }, 900);
    }
    return true;
  }

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
      <ChessBoard fen={chess.fen()} onPieceDrop={onPieceDrop} theme={theme} boardWidth={boardWidth} />
      <div style={{ flex: "1 1 240px", minWidth: 240, maxWidth: 340 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: accentGold, marginBottom: 8 }}>Puzzle, {puzzle.motif}</div>
        <p style={{ color: textMuted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>Find the best move for White.</p>
        {!session?.user && (
          <p style={{ color: textMuted, fontSize: 11.5, marginBottom: 12 }}>Sign in to have this scheduled for spaced review later.</p>
        )}
        {result && (
          <div style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 14, background: result.good ? "rgba(201,162,39,0.1)" : "rgba(224,91,91,0.1)", border: `1px solid ${result.good ? accentGold : "#E05B5B"}`, fontSize: 13, color: textMain }}>
            {result.good ? puzzle.explanation : "Not quite, the position has reset, try again."}
          </div>
        )}
        <button onClick={onBack} style={{ width: "100%", background: accentGold, color: "#1B2430", border: "none", borderRadius: 8, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          Back to lessons
        </button>
      </div>
    </div>
  );
}
