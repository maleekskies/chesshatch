import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronLeft, ChevronRight, Lightbulb, Info, RotateCcw, Lock, Target } from "lucide-react";
import ChessBoard from "../components/ChessBoard.jsx";
import { TACTIC_SERIES, TACTIC_TOTAL_LESSONS } from "../data/tacticSeries.js";
import { judgeMove, solutionMove, position } from "../lib/lessonEngine.js";
import { supabase } from "../lib/supabaseClient.js";
import { giveMoveFeedback } from "../lib/moveFeedback.js";
import { useViewport, fitBoard } from "../lib/boardSize.js";

// Intermediate tactics: ten tactic mini-series, five progressive lessons
// each, played on a real board with chess.js judging every move.
//
// This reuses the same machinery the beginner course already relies on:
// the same ChessBoard wrapper, the same lessonEngine (judgeMove /
// solutionMove), the same scripted-reply step shape, and the same
// localStorage-progress idea. Nothing here re-implements chess rules, so an
// illegal move is never accepted and the board can never drift out of sync
// with the lesson.
const PROGRESS_KEY = "chesshatch_tactic_progress_v1";

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
    /* localStorage unavailable, progress just will not survive a reload */
  }
}

function wrongMoveText(step, reason) {
  if (reason === "wrong-square") return "Not that square. " + (step.hint || "");
  if (reason === "wrong-piece") return "Not that piece. " + (step.hint || "");
  if (reason === "capture") return "Do not capture here. " + (step.hint || "");
  if (reason === "no-capture") return "That has to be a capture. " + (step.hint || "");
  if (reason === "no-check") return "That is not check. " + (step.hint || "");
  if (reason === "no-mate") return "Not mate yet, the king still has an escape. " + (step.hint || "");
  if (reason === "illegal") return "That move is not legal in this position. " + (step.hint || "");
  return "Not quite. " + (step.hint || "");
}

export default function TacticSeries({
  theme, textMain, textMuted, panelBg, borderCol, accentGold, isPhone,
  session, onEarnBadge, onExit, initialSeriesId,
}) {
  const [completed, setCompleted] = useState(loadCompleted);
  const [openSeriesId, setOpenSeriesId] = useState(initialSeriesId || null);
  const [openLessonIndex, setOpenLessonIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [highlights, setHighlights] = useState(null);
  const [version, setVersion] = useState(0);
  const chessRef = useRef(null);

  const series = openSeriesId ? TACTIC_SERIES.find((s) => s.id === openSeriesId) : null;
  const lesson = series ? series.lessons[openLessonIndex] : null;
  const step = lesson ? lesson.steps[stepIndex] : null;
  const lessonFinished = !!lesson && stepIndex >= lesson.steps.length;

  const doneCount = useMemo(
    () => TACTIC_SERIES.reduce((n, s) => n + s.lessons.filter((l) => completed.has(l.id)).length, 0),
    [completed]
  );

  // Load the step's position whenever the step changes. Steps without a fen
  // deliberately continue from the position the previous step produced.
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

  const lessonUnlocked = (s, i) => i === 0 || completed.has(s.lessons[i - 1].id);

  function openLesson(seriesId, index) {
    setOpenSeriesId(seriesId);
    setOpenLessonIndex(index);
    setStepIndex(0);
    setFeedback(null);
    setHighlights(null);
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
            { user_id: session.user.id, node_key: `tactic:${lesson.id}`, status: "mastered" },
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

  // The opponent's scripted replies play themselves, exactly like the
  // beginner course's "first slow game".
  useEffect(() => {
    if (!lesson || lessonFinished) return;
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
    }, 1100);
    return () => clearTimeout(timer);
  }, [lesson, stepIndex, lessonFinished]);

  useEffect(() => {
    if (lesson && lessonFinished) completeLesson();
  }, [lesson, lessonFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  function flashFailed(reason, from, to) {
    setFeedback({ tone: "bad", text: wrongMoveText(step, reason) });
    const marks = {};
    if (from) marks[from] = BAD;
    if (to) marks[to] = BAD;
    setHighlights(marks);
    setTimeout(() => setHighlights(null), 1000);
  }

  function acceptStep(markSquare, successText) {
    setFeedback({ tone: "good", text: successText || step.success || "Correct." });
    if (markSquare) setHighlights({ [markSquare]: GOOD });
    setTimeout(advance, 950);
  }

  // Every drop lands here. Returning false makes the piece snap back, so a
  // wrong-but-legal move never corrupts the position.
  function onPieceDrop(from, to) {
    if (!step || step.auto || step.kind === "tap" || step.kind === "read") return false;
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

  const { width: viewportW, height: viewportH } = useViewport();
  const boardWidth = isPhone
    ? fitBoard({ viewportW, viewportH, max: 340, reserveW: 40, reserveH: 250 })
    : fitBoard({ viewportW, viewportH, max: 480, min: 340, reserveW: 600, reserveH: 250 });

  // ------------------------------------------------------------- runner ----
  if (series && lesson) {
    const nextLesson = series.lessons[openLessonIndex + 1] || null;
    const seriesDone = series.lessons.filter((l) => completed.has(l.id)).length;

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <button
            onClick={() => { setOpenSeriesId(null); setStepIndex(0); }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 0 }}
          >
            <ChevronLeft size={14} /> All tactics
          </button>
          <span style={{ color: borderCol, fontSize: 12 }}>|</span>
          <span style={{ fontSize: 12, color: textMuted }}>
            {series.name}, lesson {openLessonIndex + 1} of {series.lessons.length}
            {seriesDone > 0 ? ` · ${seriesDone} done` : ""}
          </span>
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center" }}>
          <div style={{ flex: "0 0 auto" }}>
            <ChessBoard
              fen={chessRef.current ? chessRef.current.fen() : lesson.steps[0].fen}
              onPieceDrop={onPieceDrop}
              onSquareTap={onSquareTap}
              squareHighlights={highlights}
              theme={theme}
              boardWidth={boardWidth}
            />
          </div>

          <div style={{ flex: "1 1 280px", minWidth: 260, maxWidth: 380, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 14, padding: 18, minHeight: isPhone ? undefined : 420 }}>
            {lessonFinished ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: accentGold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={15} color="#FFFFFF" strokeWidth={3} />
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: textMain }}>Lesson complete</span>
                </div>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 600, margin: "0 0 10px" }}>
                  {lesson.title}
                </h2>
                <p style={{ color: textMuted, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
                  {nextLesson
                    ? `Next up in this series: ${nextLesson.title}.`
                    : `That is the whole ${series.name} series. Pick another tactic, or come back and replay these in a few days.`}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {nextLesson && (
                    <button
                      onClick={() => { setOpenLessonIndex(openLessonIndex + 1); setStepIndex(0); }}
                      style={{ background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Next lesson <ChevronRight size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => { setStepIndex(0); setFeedback(null); setHighlights(null); const first = lesson.steps.find((s) => s.fen); chessRef.current = position(first ? first.fen : lesson.steps[0].fen); void version; }}
                    style={{ background: "transparent", color: textMain, border: `1px solid ${borderCol}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}
                  >
                    Replay this lesson
                  </button>
                  <button
                    onClick={() => { setOpenSeriesId(null); setStepIndex(0); }}
                    style={{ background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, padding: "4px 0" }}
                  >
                    Back to all tactics
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10.5, letterSpacing: "0.09em", textTransform: "uppercase", color: accentGold, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {series.name}
                </div>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 600, margin: "0 0 10px" }}>
                  {lesson.title}
                </h2>

                <p style={{ color: textMain, fontSize: 13.5, lineHeight: 1.7, margin: "0 0 14px" }}>{step.say}</p>

                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}>
                  <span style={{ flex: 1, height: 1, background: borderCol }} />
                  <span style={{ color: accentGold, fontSize: 9 }}>◆</span>
                  <span style={{ flex: 1, height: 1, background: borderCol }} />
                </div>

                <p style={{ color: textMain, fontSize: 13.5, lineHeight: 1.6, margin: "0 0 14px" }}>{step.task}</p>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }} aria-label={`Step ${stepIndex + 1} of ${lesson.steps.length}`}>
                  {lesson.steps.map((s, i) => (
                    <span key={i} style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: i < stepIndex ? accentGold : i === stepIndex ? "rgba(226,105,75,0.45)" : "transparent",
                      border: `1px solid ${i <= stepIndex ? accentGold : borderCol}`,
                    }} />
                  ))}
                </div>

                {feedback && (
                  <div role="status" aria-live="polite" style={{
                    padding: "10px 12px", borderRadius: 9, marginBottom: 12,
                    background: feedback.tone === "good" ? "rgba(78,122,58,0.10)" : "rgba(224,91,91,0.10)",
                    border: `1px solid ${feedback.tone === "good" ? "#4E7A3A" : "#E05B5B"}`,
                    fontSize: 12.5, lineHeight: 1.55, color: textMain,
                  }}>
                    {feedback.text}
                  </div>
                )}

                {step.kind === "read" ? (
                  <button
                    onClick={() => advance()}
                    style={{ width: "100%", background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Continue
                  </button>
                ) : (
                  <>
                    {step.hint && (
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
                    )}
                    {hintOpen && (
                      <p style={{ color: textMuted, fontSize: 12.5, lineHeight: 1.6, margin: "0 0 12px" }}>{step.hint}</p>
                    )}
                    <button
                      onClick={showMe}
                      style={{ background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, padding: 0 }}
                    >
                      Show me
                    </button>
                  </>
                )}

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

  // ---------------------------------------------------------------- hub ----
  return (
    <div style={{ maxWidth: 860 }}>
      {onExit && (
        <button onClick={onExit} style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: textMuted, fontSize: 12.5, cursor: "pointer", marginBottom: 14, padding: 0 }}>
          <ChevronLeft size={14} /> Back
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(226,105,75,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Target size={19} color={accentGold} />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: isPhone ? 21 : 25, fontWeight: 700, margin: 0 }}>
            Intermediate tactics
          </h2>
          <p style={{ color: textMuted, fontSize: 12.5, margin: "3px 0 0" }}>
            {TACTIC_SERIES.length} tactics, {TACTIC_TOTAL_LESSONS} short lessons, five steps each, played on a real board.
          </p>
        </div>
      </div>

      <p style={{ color: textMuted, fontSize: 13.5, lineHeight: 1.6, margin: "0 0 18px", maxWidth: 620 }}>
        Each tactic is a mini series, not a single puzzle. You identify the pattern, see why it works,
        find the move, use it in a different position, and finish with the whole combination. Lessons
        inside a series unlock in order, and every position is real chess: an illegal move is never accepted.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", minWidth: 180 }}>
          <div style={{ height: 6, background: borderCol, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(doneCount / TACTIC_TOTAL_LESSONS) * 100}%`, background: accentGold, transition: "width 240ms ease" }} />
          </div>
        </div>
        <span style={{ fontSize: 11.5, color: textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
          {doneCount}/{TACTIC_TOTAL_LESSONS} lessons done
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TACTIC_SERIES.map((s) => {
          const done = s.lessons.filter((l) => completed.has(l.id)).length;
          const complete = done === s.lessons.length;
          const nextIndex = s.lessons.findIndex((l) => !completed.has(l.id));
          const resuming = nextIndex > 0;
          return (
            <div key={s.id} style={{ background: panelBg, border: `1px solid ${complete ? "#4E7A3A" : borderCol}`, borderRadius: 14, padding: isPhone ? "14px 16px" : "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: complete ? "#4E7A3A" : "transparent", border: `1.5px solid ${complete ? "#4E7A3A" : borderCol}`, color: complete ? "#FFFFFF" : textMuted, fontSize: 11.5, fontWeight: 600 }}>
                  {complete ? <Check size={14} strokeWidth={3} /> : done}
                </div>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: textMain }}>{s.name}</span>
                    <span style={{ fontSize: 10.5, color: textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>{done}/{s.lessons.length}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.55, margin: "4px 0 0" }}>{s.tagline}</p>
                </div>
                <button
                  onClick={() => openLesson(s.id, Math.max(nextIndex, 0))}
                  style={{
                    background: complete ? "transparent" : accentGold, color: complete ? textMain : "#FFFFFF",
                    border: complete ? `1px solid ${borderCol}` : "none", borderRadius: 10,
                    padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {complete ? <><RotateCcw size={13} /> Replay</> : resuming ? <>Continue <ChevronRight size={13} /></> : <>Start <ChevronRight size={13} /></>}
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {s.lessons.map((l, i) => {
                  const doneLesson = completed.has(l.id);
                  const unlocked = lessonUnlocked(s, i);
                  return (
                    <button
                      key={l.id}
                      onClick={() => unlocked && openLesson(s.id, i)}
                      disabled={!unlocked}
                      title={unlocked ? l.title : "Finish the lesson before this one first."}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: doneLesson ? "rgba(78,122,58,0.12)" : "transparent",
                        border: `1px solid ${doneLesson ? "#4E7A3A" : borderCol}`,
                        color: unlocked ? textMuted : borderCol,
                        borderRadius: 20, padding: "4px 10px", fontSize: 11.5,
                        cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.7,
                      }}
                    >
                      {!unlocked && <Lock size={10} />}
                      {doneLesson && <Check size={11} strokeWidth={3} color="#4E7A3A" />}
                      {i + 1}. {l.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
