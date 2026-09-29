import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Check, Lock, ChevronLeft, ChevronRight, Lightbulb, Info, RotateCcw, Sparkles, Flag,
} from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import { BEGINNER_COURSE, BEGINNER_COURSE_TOTAL } from "../data/beginnerCourse.js";
import { judgeMove, solutionMove, position } from "../lib/lessonEngine.js";
import { supabase } from "../lib/supabaseClient.js";
import { giveMoveFeedback } from "../lib/moveFeedback.js";

// "Start from zero.": the total-beginner path, and the only part of the app
// that assumes no chess knowledge at all.
//
// Two views, both in this file:
//   - the hub, a numbered list of the twelve lessons with a preview of the
//     lesson you are up to,
//   - the lesson runner, one position per screen: a short explanation, a real
//     task on the board, feedback, a hint, and "Show me".
//
// Nothing here judges a move by comparing coordinates to a script. Every drop
// goes through `judgeMove`, which asks chess.js whether that move is actually
// legal in the position on the board, so an illegal move can never be
// accepted and the board state can never drift out of sync with the lesson.

const PROGRESS_KEY = "chesshatch_beginner_course_v1";
const UNLOCK_ALL_KEY = "chesshatch_beginner_unlock_all";
const GOOD = { boxShadow: "inset 0 0 0 4px rgba(78,122,58,0.95)" };
const BAD = { boxShadow: "inset 0 0 0 4px rgba(224,91,91,0.95)" };

function loadCompleted() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function persistCompleted(set) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]));
  } catch {
    /* localStorage unavailable, progress just won't survive a reload */
  }
}

// Why the learner's drop didn't count. The wording stays specific to what
// they actually did, so the feedback teaches instead of just refusing.
function wrongMoveText(step, reason) {
  if (reason === "wrong-square") return "Not that square. " + (step.hint || "");
  if (reason === "wrong-piece") return "Not that piece. " + (step.hint || "");
  if (reason === "capture") return "Don't capture here. " + (step.hint || "");
  if (reason === "no-capture") return "That has to be a capture. " + (step.hint || "");
  if (reason === "no-check") return "That isn't check. " + (step.hint || "");
  if (reason === "no-mate") return "Not mate yet, the king still has a way out. " + (step.hint || "");
  return "Not quite. " + (step.hint || "");
}

export default function BeginnerCourse({ theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone, session, onExit, onEarnBadge }) {
  const [completed, setCompleted] = useState(loadCompleted);
  const [unlockAll, setUnlockAll] = useState(() => {
    try { return localStorage.getItem(UNLOCK_ALL_KEY) === "1"; } catch { return false; }
  });
  const [openId, setOpenId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [highlights, setHighlights] = useState(null);
  const [version, setVersion] = useState(0);
  const chessRef = useRef(null);

  const firstUnfinished = useMemo(
    () => BEGINNER_COURSE.find((l) => !completed.has(l.id)) || BEGINNER_COURSE[0],
    [completed]
  );
  const lesson = openId ? BEGINNER_COURSE.find((l) => l.id === openId) : null;
  const step = lesson ? lesson.steps[stepIndex] : null;
  const finished = !!lesson && stepIndex >= lesson.steps.length;
  const lessonNumber = lesson ? BEGINNER_COURSE.findIndex((l) => l.id === lesson.id) + 1 : 0;

  const previewLesson =
    BEGINNER_COURSE.find((l) => l.id === selectedId) || firstUnfinished;
  const previewFen =
    (previewLesson.steps.find((s) => s.fen) || {}).fen || BEGINNER_COURSE[0].steps[0].fen;

  // Load the step's position whenever the step changes. Steps without a fen
  // deliberately continue from the position the last move produced.
  useEffect(() => {
    if (!lesson) return;
    const next = lesson.steps[stepIndex];
    if (!next) return;
    if (next.fen) chessRef.current = position(next.fen);
    setFeedback(null);
    setHintOpen(false);
    setHighlights(null);
    setVersion((v) => v + 1);
  }, [lesson, stepIndex]);

  const isUnlocked = useCallback(
    (id) => {
      if (unlockAll) return true;
      const index = BEGINNER_COURSE.findIndex((l) => l.id === id);
      if (index <= 0) return true;
      return completed.has(BEGINNER_COURSE[index - 1].id);
    },
    [completed, unlockAll]
  );

  function openLesson(id, { jumpToEnd = false } = {}) {
    if (!isUnlocked(id)) return;
    const l = BEGINNER_COURSE.find((x) => x.id === id);
    setOpenId(id);
    setSelectedId(id);
    setStepIndex(jumpToEnd ? 0 : 0);
    setFeedback(null);
    setHintOpen(false);
    const first = l.steps.find((s) => s.fen);
    chessRef.current = position(first ? first.fen : BEGINNER_COURSE[0].steps[0].fen);
    void version;
  }

  function completeLesson() {
    if (!lesson) return;
    onEarnBadge?.("first_lesson");
    setCompleted((prev) => {
      if (prev.has(lesson.id)) return prev;
      const next = new Set(prev).add(lesson.id);
      persistCompleted(next);
      if (session?.user) {
        supabase
          .from("progress")
          .upsert(
            { user_id: session.user.id, node_key: `beginner:${lesson.id}`, status: "mastered" },
            { onConflict: "user_id,node_key" }
          )
          .then(() => {}, () => {});
      }
      return next;
    });
  }

  function advance() {
    setStepIndex((i) => i + 1);
  }

  // The opponent's scripted replies in "Your first slow game" play themselves.
  useEffect(() => {
    if (!lesson || finished) return;
    const current = lesson.steps[stepIndex];
    if (!current?.auto) return;
    const timer = setTimeout(() => {
      const verdict = judgeMove(chessRef.current, current.auto.from, current.auto.to, { anyLegal: true });
      if (verdict.ok) {
        chessRef.current = verdict.after;
        giveMoveFeedback();
        setVersion((v) => v + 1);
      }
      advance();
    }, 1200);
    return () => clearTimeout(timer);
  }, [lesson, stepIndex, finished]);

  useEffect(() => {
    if (lesson && finished) completeLesson();
  }, [lesson, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  function flashFailed(reason, from, to) {
    setFeedback({ tone: "bad", text: wrongMoveText(step, reason) });
    const marks = {};
    if (from) marks[from] = BAD;
    if (to) marks[to] = BAD;
    setHighlights(marks);
    setTimeout(() => setHighlights(null), 1000);
  }

  function acceptStep(markSquare, successText) {
    setFeedback({ tone: "good", text: successText || step.success });
    if (markSquare) setHighlights({ [markSquare]: GOOD });
    if (stepIndex + 1 >= lesson.steps.length) {
      const timer = setTimeout(advance, 500);
      return () => clearTimeout(timer);
    }
    setTimeout(advance, 900);
    return undefined;
  }

  // Every drop lands here. Returning false is what makes the piece snap back,
  // so a wrong-but-legal move never corrupts the position.
  function onPieceDrop(from, to) {
    if (!step || step.auto || step.kind === "tap") return false;
    const verdict = judgeMove(chessRef.current, from, to, step.accept || {});
    if (!verdict.ok) {
      flashFailed(verdict.reason, from, to);
      return false;
    }
    chessRef.current = verdict.after;
    setVersion((v) => v + 1);
    acceptStep(to);
    return true;
  }

  function onSquareTap(square) {
    if (!step || step.kind !== "tap") return;
    if (square === step.answer) {
      acceptStep(square);
      return;
    }
    flashFailed("wrong-square", square, null);
  }

  // "Show me": plays the lesson's own answer on the board and moves on, so a
  // learner who is stuck is never stuck for good.
  function showMe() {
    if (!step) return;
    if (step.kind === "tap") {
      acceptStep(step.answer);
      return;
    }
    const solution = solutionMove(chessRef.current, step);
    if (!solution) return;
    const verdict = judgeMove(chessRef.current, solution.from, solution.to, step.accept || {});
    if (!verdict.ok) return;
    chessRef.current = verdict.after;
    setVersion((v) => v + 1);
    acceptStep(solution.to);
  }

  // Same guard as ChessBoard: innerWidth can momentarily read 0/1, which would
  // turn these into negative numbers.
  const viewportWidth = Math.max(typeof window === "undefined" ? 0 : window.innerWidth || 0, 360);
  const boardWidth = isPhone
    ? Math.min(360, viewportWidth - 40)
    : Math.min(520, Math.max(380, viewportWidth - 660));
  const previewWidth = isPhone ? Math.min(300, viewportWidth - 80) : 300;

  // ---------------------------------------------------------------- hub ----
  if (!lesson) {
    return (
      <div>
        <button
          onClick={onExit}
          style={{ background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 14, padding: 0 }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <img
              src="/logo-mark.png"
              alt=""
              width={44}
              height={44}
              style={{ width: 44, height: 44, display: "block", marginBottom: 12 }}
            />
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: isPhone ? 28 : 36, fontWeight: 700, margin: "0 0 6px" }}>
              Start from zero.
            </h1>
            <p style={{ color: textMuted, fontSize: isPhone ? 14 : 15, margin: 0 }}>
              One idea at a time. You do not need to know anything yet.
            </p>
          </div>
          {!unlockAll && (
            <button
              onClick={() => {
                setUnlockAll(true);
                try { localStorage.setItem(UNLOCK_ALL_KEY, "1"); } catch { /* ignore */ }
              }}
              style={{ background: "transparent", border: "none", color: textMuted, fontSize: 11.5, cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              Unlock all lessons
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr" : "minmax(0, 1fr) 344px", gap: 22, alignItems: "start", marginTop: 24 }}>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {BEGINNER_COURSE.map((l, i) => {
              const done = completed.has(l.id);
              const unlocked = isUnlocked(l.id);
              const current = !done && l.id === firstUnfinished.id;
              return (
                <li key={l.id}>
                  <button
                    onClick={() => openLesson(l.id)}
                    aria-current={current ? "step" : undefined}
                    title={unlocked ? l.blurb : "Finish the lesson before this one first, or unlock all lessons."}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                      background: current ? "rgba(226,105,75,0.10)" : panelBg,
                      border: `1px solid ${current ? accentGold : borderCol}`,
                      borderRadius: 12, padding: "12px 14px", cursor: unlocked ? "pointer" : "not-allowed",
                      opacity: unlocked ? 1 : 0.55,
                    }}
                  >
                    <span
                      style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: done ? "#4E7A3A" : current ? accentGold : "transparent",
                        border: `1px solid ${done || current ? "transparent" : borderCol}`,
                        color: done || current ? "#FFFFFF" : textMuted,
                        fontSize: 12.5, fontWeight: 700,
                      }}
                    >
                      {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: textMain }}>{l.title}</span>
                      <span style={{ display: "block", fontSize: 12, color: textMuted, marginTop: 2 }}>{l.blurb}</span>
                    </span>
                    {current && !isPhone && (
                      <span
                        style={{
                          display: "flex", alignItems: "center", gap: 4, background: accentGold, color: "#FFFFFF",
                          borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600, flexShrink: 0,
                        }}
                      >
                        Continue <ChevronRight size={13} />
                      </span>
                    )}
                    {!done && !current && <Lock size={14} color={textMuted} style={{ flexShrink: 0 }} />}
                  </button>
                </li>
              );
            })}
          </ol>

          <aside
            style={{
              background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 16, padding: 18,
              position: isPhone ? "static" : "sticky", top: 88,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: accentGold, fontFamily: "'IBM Plex Mono', monospace" }}>
                Lesson {BEGINNER_COURSE.findIndex((l) => l.id === previewLesson.id) + 1} of {BEGINNER_COURSE_TOTAL}
              </span>
              {completed.has(previewLesson.id) && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4E7A3A" }}>
                  <Check size={12} strokeWidth={3} /> Done
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, margin: "8px 0 12px" }}>
              {previewLesson.title}
            </h2>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <ChessBoard fen={previewFen} theme={theme} boardWidth={previewWidth} arePiecesDraggable={false} />
            </div>
            <p style={{ color: textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{previewLesson.blurb}</p>
            <button
              onClick={() => openLesson(previewLesson.id)}
              disabled={!isUnlocked(previewLesson.id)}
              style={{
                width: "100%", background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 10,
                padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {completed.has(previewLesson.id) ? "Replay lesson" : "Continue lesson"} <ChevronRight size={15} />
            </button>
          </aside>
        </div>

        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 26, paddingTop: 18,
            borderTop: `1px solid ${borderCol}`,
          }}
        >
          <span
            style={{
              width: 34, height: 34, borderRadius: "50%", border: `1px solid ${borderCol}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <Flag size={15} color={accentGold} />
          </span>
          <span style={{ fontSize: 13, color: textMuted }}>
            Wrong moves are okay. <span style={{ color: textMain, fontWeight: 600 }}>We will show you the right square.</span>
          </span>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- runner ----
  const index = BEGINNER_COURSE.findIndex((l) => l.id === lesson.id);
  const nextLesson = BEGINNER_COURSE[index + 1] || null;
  const isTapStep = step?.kind === "tap";
  const busy = !!step?.auto;
  const progressLabel = finished
    ? "Complete"
    : `Lesson ${lessonNumber} of ${BEGINNER_COURSE_TOTAL}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => { setOpenId(null); setFeedback(null); setHighlights(null); }}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 0 }}
        >
          <ChevronLeft size={14} /> All lessons
        </button>
        <span
          style={{
            fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: accentGold,
            border: `1px solid ${borderCol}`, borderRadius: 20, padding: "5px 12px",
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {progressLabel}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr" : `minmax(0, 1fr) 340px`, gap: 22, alignItems: "start" }}>
        <div style={{ maxWidth: isPhone ? "none" : 560 }}>
          <ChessBoard
            fen={chessRef.current ? chessRef.current.fen() : BEGINNER_COURSE[0].steps[0].fen}
            onPieceDrop={isTapStep || busy || finished ? undefined : onPieceDrop}
            onSquareTap={isTapStep && !finished ? onSquareTap : undefined}
            arePiecesDraggable={!isTapStep && !busy && !finished}
            theme={theme}
            boardWidth={boardWidth}
            squareHighlights={highlights}
          />
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12,
              background: feedback?.tone === "bad" ? "rgba(224,91,91,0.10)" : panelBg,
              border: `1px solid ${feedback?.tone === "bad" ? "#E05B5B" : feedback?.tone === "good" ? "#4E7A3A" : borderCol}`,
              borderRadius: 12, padding: "12px 14px", maxWidth: boardWidth,
            }}
          >
            <span
              style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: feedback?.tone === "bad" ? "#E05B5B" : feedback?.tone === "good" ? "#4E7A3A" : "rgba(226,105,75,0.14)",
              }}
            >
              {feedback?.tone === "bad" ? (
                <RotateCcw size={12} color="#FFFFFF" />
              ) : feedback?.tone === "good" ? (
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Sparkles size={12} color={accentGold} />
              )}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: textMain }}>
              {finished
                ? "Lesson complete."
                : feedback
                ? feedback.text
                : busy
                ? "Black is replying…"
                : isTapStep
                ? "Tap the square the lesson asks for."
                : "You are White. Drag the piece, or tap it and tap where it goes."}
            </span>
          </div>
        </div>

        <div style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 16, padding: isPhone ? 16 : 20 }}>
          <span
            style={{
              display: "inline-block", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase",
              color: accentGold, border: `1px solid ${borderCol}`, borderRadius: 20, padding: "4px 10px",
              fontFamily: "'IBM Plex Mono', monospace", marginBottom: 12,
            }}
          >
            Lesson {lessonNumber} of {BEGINNER_COURSE_TOTAL}
          </span>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: isPhone ? 22 : 26, fontWeight: 700, margin: "0 0 12px" }}>
            {lesson.title}
          </h2>

          {finished ? (
            <div>
              <p style={{ color: textMuted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>
                You finished <span style={{ color: textMain, fontWeight: 600 }}>{lesson.title}</span>.
                {nextLesson ? " The next lesson is unlocked." : " That is the whole beginner course."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {nextLesson ? (
                  <button
                    onClick={() => openLesson(nextLesson.id)}
                    style={{
                      background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 10,
                      padding: "12px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    Next: {nextLesson.title} <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={onExit}
                    style={{
                      background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 10,
                      padding: "12px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Back to the start
                  </button>
                )}
                <button
                  onClick={() => { setStepIndex(0); setFeedback(null); setHighlights(null); const first = lesson.steps.find((s) => s.fen); chessRef.current = position(first ? first.fen : BEGINNER_COURSE[0].steps[0].fen); }}
                  style={{
                    background: "transparent", color: textMain, border: `1px solid ${borderCol}`,
                    borderRadius: 10, padding: "11px 16px", fontSize: 13, cursor: "pointer",
                  }}
                >
                  Replay this lesson
                </button>
                <button
                  onClick={() => setOpenId(null)}
                  style={{ background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", padding: "4px 0" }}
                >
                  Back to all lessons
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ color: textMain, fontSize: 13.5, lineHeight: 1.7, margin: "0 0 16px" }}>{step.say}</p>

              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}>
                <span style={{ flex: 1, height: 1, background: borderCol }} />
                <span style={{ color: accentGold, fontSize: 9 }}>◆</span>
                <span style={{ flex: 1, height: 1, background: borderCol }} />
              </div>

              <div style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: textMuted, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                Task
              </div>
              <p style={{ color: textMain, fontSize: 13.5, lineHeight: 1.6, margin: "0 0 14px" }}>{step.task}</p>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }} aria-label={`Step ${stepIndex + 1} of ${lesson.steps.length}`}>
                {lesson.steps.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: i < stepIndex ? accentGold : i === stepIndex ? "rgba(226,105,75,0.45)" : "transparent",
                      border: `1px solid ${i <= stepIndex ? accentGold : borderCol}`,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setHintOpen((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: hintOpen ? "rgba(226,105,75,0.10)" : "transparent",
                  border: `1px solid ${hintOpen ? accentGold : borderCol}`, color: textMain,
                  borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer", marginBottom: 10,
                }}
              >
                <Lightbulb size={14} color={accentGold} /> {hintOpen ? "Hide hint" : "Hint"}
              </button>
              {hintOpen && (
                <p style={{ color: textMuted, fontSize: 12.5, lineHeight: 1.6, margin: "0 0 12px" }}>{step.hint}</p>
              )}

              <button
                onClick={showMe}
                style={{ background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", padding: 0, marginBottom: step.note ? 16 : 0 }}
              >
                Show me
              </button>

              {step.note && (
                <div style={{ display: "flex", gap: 9, background: "rgba(226,105,75,0.06)", border: `1px solid ${borderCol}`, borderRadius: 10, padding: "11px 12px", marginTop: 16 }}>
                  <Info size={14} color={accentGold} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, lineHeight: 1.55, color: textMuted }}>{step.note}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
