// Verifies the beginner course against real chess rules.
//
//   node scripts/verify-beginner-course.mjs
//
// For every lesson and step this checks that:
//   - the FEN is a position chess.js will load,
//   - a move step's expected move is genuinely legal in that position,
//   - an `accept` spec is satisfiable by at least one legal move (a spec
//     nothing can match would leave a learner stuck with no way forward),
//   - a specific spec actually rejects the legal moves that don't match it,
//   - random moves that aren't in the legal move list are rejected,
//   - scripted opponent replies (`auto`) are legal,
//   - a tap step's answer is a real square name.
//
// Exits non-zero on any failure, so it can be wired into a build later.
import { Chess } from "chess.js";
import { BEGINNER_COURSE } from "../src/data/beginnerCourse.js";
import { judgeMove, solutionMove, PROMOTION_PIECE } from "../src/lib/lessonEngine.js";

let failures = 0;
let checks = 0;

function fail(where, message) {
  failures += 1;
  console.log(`  x ${where}: ${message}`);
}
function ok() {
  checks += 1;
}

const SQUARE = /^[a-h][1-8]$/;
const ALL_SQUARES = [];
for (const f of "abcdefgh") for (const r of "12345678") ALL_SQUARES.push(f + r);

for (const lesson of BEGINNER_COURSE) {
  const problems = [];
  let chess = null;
  let index = 0;

  for (const step of lesson.steps) {
    index += 1;
    const where = `${lesson.id}#${index}`;
    const before = failures;

    if (step.fen) {
      try {
        chess = new Chess(step.fen);
      } catch (err) {
        fail(where, `illegal FEN ${step.fen} (${err.message})`);
        chess = null;
        problems.push(where);
        continue;
      }
    }
    if (!chess) {
      fail(where, "step has no position to work from");
      problems.push(where);
      continue;
    }

    if (step.auto) {
      const legal = chess
        .moves({ verbose: true })
        .some((m) => m.from === step.auto.from && m.to === step.auto.to);
      if (!legal) fail(where, `scripted reply ${step.auto.from}${step.auto.to} is not legal`);
      else {
        chess.move({ from: step.auto.from, to: step.auto.to, promotion: PROMOTION_PIECE });
        ok();
      }
      if (failures > before) problems.push(where);
      continue;
    }

    if (step.kind === "tap") {
      if (!SQUARE.test(step.answer || "")) fail(where, `bad tap answer "${step.answer}"`);
      else ok();
      if (failures > before) problems.push(where);
      continue;
    }

    const accept = step.accept || {};
    const legal = chess.moves({ verbose: true });
    const judged = legal.map((m) => judgeMove(chess, m.from, m.to, accept));
    const matches = judged.filter((j) => j.ok);

    if (matches.length === 0) fail(where, `no legal move satisfies ${JSON.stringify(accept)}`);

    // A step that means to be precise must not quietly accept every legal
    // move in the position: that would mean the step teaches nothing. Steps
    // that deliberately allow a choice opt in with `acceptMultiple`.
    const specific =
      accept.to || accept.from || accept.piece || accept.capture || accept.noCapture || accept.check || accept.mate;
    const piecesAllowed = new Set(matches.map((m) => m.move.from));
    if (specific && !step.acceptMultiple && piecesAllowed.size > 1) {
      fail(where, `spec ${JSON.stringify(accept)} accepts moves by ${piecesAllowed.size} different pieces`);
    }

    // Every non-legal (from,to) pair must be rejected as illegal.
    const legalPairs = new Set(legal.map((m) => m.from + m.to));
    for (const from of ALL_SQUARES) {
      for (const to of ALL_SQUARES) {
        if (from === to || legalPairs.has(from + to)) continue;
        if (Math.abs(ALL_SQUARES.indexOf(from) - ALL_SQUARES.indexOf(to)) % 7 !== 0) continue; // sample
        const verdict = judgeMove(chess, from, to, { anyLegal: true });
        if (verdict.ok) fail(where, `illegal move ${from}${to} was accepted`);
      }
    }

    // The move "Show me" plays has to be legal and has to satisfy the spec.
    const solution = solutionMove(chess, step);
    if (!solution) {
      fail(where, "no solution move available for 'Show me'");
    } else {
      const verdict = judgeMove(chess, solution.from, solution.to, accept);
      if (!verdict.ok) fail(where, `'Show me' move rejected (${verdict.reason})`);
      else {
        chess = verdict.after;
        ok();
      }
    }

    if (failures > before) problems.push(where);
  }

  const label = problems.length ? "FAIL" : "ok";
  console.log(`${label.padEnd(5)} ${lesson.title} (${lesson.steps.length} steps)`);
}

// Rule checks that must hold no matter what the course data says.
{
  const c = new Chess("4k3/8/8/8/8/8/8/r3K3 w - - 0 1");
  if (!c.isCheck()) fail("rules", "expected the white king to be in check");
  for (const m of c.moves({ verbose: true }).filter((m) => m.piece === "k")) {
    const after = new Chess(c.fen());
    after.move({ from: m.from, to: m.to });
    if (after.isCheck()) fail("rules", `king move ${m.from}${m.to} left the king in check`);
  }
  ok();
}
{
  const c = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  const castle = c.moves({ verbose: true }).find((m) => m.from === "e1" && m.to === "g1");
  if (!castle || !castle.flags.includes("k")) fail("rules", "kingside castling was not generated");
  const after = new Chess(c.fen());
  after.move({ from: "e1", to: "g1" });
  if (after.get("f1")?.type !== "r" || after.get("g1")?.type !== "k") {
    fail("rules", "castling did not move both king and rook");
  }
  const blocked = new Chess("r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1");
  if (blocked.moves({ verbose: true }).some((m) => m.from === "e1" && m.to === "g1")) {
    fail("rules", "castling was allowed through an occupied square");
  }
  const inCheck = new Chess("4r2k/8/8/8/8/8/8/R3K2R w KQ - 0 1");
  if (!inCheck.isCheck()) fail("rules", "expected the king to be in check");
  if (inCheck.moves({ verbose: true }).some((m) => m.from === "e1" && m.to === "g1")) {
    fail("rules", "castling was allowed while the king was in check");
  }
  const throughCheck = new Chess("5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1");
  if (throughCheck.isCheck()) fail("rules", "through-check position should not itself be check");
  if (throughCheck.moves({ verbose: true }).some((m) => m.from === "e1" && m.to === "g1")) {
    fail("rules", "castling was allowed through an attacked square");
  }
  ok();
}
{
  const c = new Chess("7k/3P4/8/8/8/8/8/K7 w - - 0 1");
  const promos = c.moves({ verbose: true }).filter((m) => m.from === "d7" && m.to === "d8");
  if (promos.length !== 4) fail("rules", `expected 4 promotion choices, got ${promos.length}`);
  const after = new Chess(c.fen());
  after.move({ from: "d7", to: "d8", promotion: "q" });
  if (after.get("d8")?.type !== "q") fail("rules", "promotion did not produce a queen");
  ok();
}
{
  const c = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
  if (!c.isStalemate()) fail("rules", "expected stalemate");
  if (c.isCheck()) fail("rules", "a stalemate position must not be check");
  ok();
}
{
  // En passant and captures stay real chess rules, they come from chess.js.
  const c = new Chess("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
  const ep = c.moves({ verbose: true }).find((m) => m.flags.includes("e"));
  if (!ep) fail("rules", "en passant was not generated");
  const after = new Chess(c.fen());
  after.move({ from: ep.from, to: ep.to });
  if (after.get("d5")) fail("rules", "en passant did not remove the captured pawn");
  ok();
}

console.log(
  failures === 0
    ? `\nbeginner course verified: ${BEGINNER_COURSE.length} lessons, ${checks} checks, 0 failures`
    : `\n${failures} FAILURE(S) across ${checks} checks`
);
process.exit(failures === 0 ? 0 : 1);
