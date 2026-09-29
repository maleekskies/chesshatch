// Move validation for the beginner course.
//
// Every step is judged against the real position with chess.js instead of
// comparing raw coordinates to a script. Two things fall out of that:
//   - a step can never accept a move that isn't legal in the position on
//     the board (illegal drops never even reach here, ChessBoard's own
//     snap-back check rejects them first), and
//   - a step whose expected move is wrong for its FEN fails loudly in
//     `scripts/verify-beginner-course.mjs` instead of quietly mis-teaching
//     a beginner.
import { Chess } from "chess.js";

// The lessons always promote to a queen. Promotion is still real chess
// rules, chess.js is the thing generating the promoted move, we just don't
// ask a first-week beginner to choose the piece.
export const PROMOTION_PIECE = "q";

export function position(fen) {
  return new Chess(fen);
}

/** Is `from`->`to` a legal move in this position? */
export function isLegalMove(chess, from, to, promotion = PROMOTION_PIECE) {
  return chess
    .moves({ verbose: true })
    .some((m) => m.from === from && m.to === to && (!m.promotion || m.promotion === promotion));
}

/**
 * Judge a dropped move against a step's `accept` spec.
 *
 * Supported specs (all optional, combined with AND):
 *   { from: "e2" }          the piece must start on this square
 *   { to: "e4" }            it must land on this square
 *   { piece: "n" }          the moving piece type must match
 *   { anyLegal: true }      anything legal counts
 *   { capture: true }       it must be a capture
 *   { noCapture: true }     it must not be a capture
 *   { check: true }         the move must give check (but not mate)
 *   { mate: true }          the move must be checkmate
 *
 * Returns { ok, move, after, reason }. `after` is the resulting position as
 * a fresh Chess instance, so callers never re-implement move application.
 */
export function judgeMove(chess, from, to, accept = {}) {
  const candidates = chess
    .moves({ verbose: true })
    .filter((m) => m.from === from && m.to === to);

  // Not a legal move in this position at all.
  if (candidates.length === 0) return { ok: false, reason: "illegal" };

  const move = candidates.find((m) => m.promotion === PROMOTION_PIECE) || candidates[0];
  const after = new Chess(chess.fen());
  after.move({ from: move.from, to: move.to, promotion: move.promotion || undefined });
  const verdict = { move, after };

  if (accept.from && accept.from !== move.from) return { ...verdict, ok: false, reason: "wrong-piece" };
  if (accept.to && accept.to !== move.to) return { ...verdict, ok: false, reason: "wrong-square" };
  if (accept.piece && accept.piece !== move.piece) return { ...verdict, ok: false, reason: "wrong-piece" };
  if (accept.noCapture && move.captured) return { ...verdict, ok: false, reason: "capture" };
  if (accept.capture && !move.captured) return { ...verdict, ok: false, reason: "no-capture" };
  if (accept.check && !(after.isCheck() && !after.isCheckmate())) {
    return { ...verdict, ok: false, reason: "no-check" };
  }
  if (accept.mate && !after.isCheckmate()) return { ...verdict, ok: false, reason: "no-mate" };

  return { ...verdict, ok: true };
}

/**
 * The move the learner is being asked for, used by the "Show me" button.
 * Prefers an explicit `reveal`, otherwise the first move that satisfies the
 * step's accept spec, so "Show me" can never play something the step would
 * then reject.
 */
export function solutionMove(chess, step) {
  if (step.reveal) return { ...step.reveal };
  const accept = step.accept || {};
  const found = chess.moves({ verbose: true }).find((m) => judgeMove(chess, m.from, m.to, accept).ok);
  return found ? { from: found.from, to: found.to } : null;
}

/** Human-readable summary of what a step wants, for the status bar. */
export function stepHint(step) {
  if (step.kind === "tap") return step.task;
  return step.task;
}
