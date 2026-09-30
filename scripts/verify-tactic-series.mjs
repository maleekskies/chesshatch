// Verifies the intermediate tactic series against real chess rules.
//
//   node scripts/verify-tactic-series.mjs
//
// For every tactic, lesson and step this checks that:
//   - lesson and series ids are unique,
//   - the FEN is a position chess.js will load,
//   - a scripted opponent reply (`auto`) is legal,
//   - a tap step's answer is a real square name,
//   - a move step's `accept` spec is satisfiable, is not satisfied by every
//     legal move in the position, and (unless the step opts into a choice
//     with `acceptMultiple`) cannot be satisfied by two different pieces,
//   - the move "Show me" would play is legal and satisfies the spec.
//
// Exits non-zero on any failure.
import { Chess } from "chess.js";
import { TACTIC_SERIES } from "../src/data/tacticSeries.js";
import { judgeMove, solutionMove, PROMOTION_PIECE } from "../src/lib/lessonEngine.js";

let failures = 0;
let checks = 0;

function fail(where, message) {
  failures += 1;
  console.log(`  x ${where}: ${message}`);
}
function ok() { checks += 1; }

const SQUARE = /^[a-h][1-8]$/;
const ALL_SQUARES = [];
for (const f of "abcdefgh") for (const r of "12345678") ALL_SQUARES.push(f + r);

const seenSeries = new Set();
const seenLessons = new Set();
let stepCount = 0;

for (const series of TACTIC_SERIES) {
  if (seenSeries.has(series.id)) fail(series.id, "duplicate series id");
  seenSeries.add(series.id);

  for (const lesson of series.lessons) {
    const where = `${lesson.id}`;
    if (seenLessons.has(lesson.id)) fail(where, "duplicate lesson id");
    seenLessons.add(lesson.id);
    if (!lesson.title) fail(where, "lesson has no title");
    if (!lesson.steps?.length) fail(where, "lesson has no steps");

    let chess = null;
    let index = 0;
    let problems = 0;

    for (const step of lesson.steps) {
      index += 1;
      stepCount += 1;
      const at = `${where}#${index}`;
      const before = failures;

      if (step.fen) {
        try {
          chess = new Chess(step.fen);
        } catch (err) {
          fail(at, `illegal FEN ${step.fen} (${err.message})`);
          chess = null;
          problems += 1;
          continue;
        }
      }
      if (!chess) {
        fail(at, "step has no position to work from");
        problems += 1;
        continue;
      }

      if (step.auto) {
        const legal = chess.moves({ verbose: true }).some((m) => m.from === step.auto.from && m.to === step.auto.to);
        if (!legal) fail(at, `scripted reply ${step.auto.from}${step.auto.to} is not legal`);
        else {
          chess = new Chess(chess.fen());
          chess.move({ from: step.auto.from, to: step.auto.to, promotion: PROMOTION_PIECE });
          ok();
        }
        if (failures > before) problems += 1;
        continue;
      }

      if (step.kind === "tap") {
        if (!SQUARE.test(step.answer || "")) fail(at, `bad tap answer "${step.answer}"`);
        else ok();
        if (failures > before) problems += 1;
        continue;
      }

      if (step.kind === "read" || (!step.accept && !step.reveal)) {
        // A read-only step: nothing to judge, but it must not advance the
        // position on its own.
        ok();
        continue;
      }

      const accept = step.accept || {};
      const legal = chess.moves({ verbose: true });
      const judged = legal.map((m) => judgeMove(chess, m.from, m.to, accept));
      const matches = judged.filter((j) => j.ok);

      if (matches.length === 0) fail(at, `no legal move satisfies ${JSON.stringify(accept)}`);

      const specific =
        accept.to || accept.from || accept.piece || accept.capture || accept.noCapture || accept.check || accept.mate;
      const piecesAllowed = new Set(matches.map((m) => m.move.from));
      if (specific && !step.acceptMultiple && piecesAllowed.size > 1) {
        fail(at, `spec ${JSON.stringify(accept)} accepts moves by ${piecesAllowed.size} different pieces`);
      }
      if (specific && matches.length >= legal.length) {
        fail(at, `spec ${JSON.stringify(accept)} accepts every legal move in the position`);
      }

      const solution = solutionMove(chess, step);
      if (!solution) {
        fail(at, "no solution move available for 'Show me'");
      } else {
        const verdict = judgeMove(chess, solution.from, solution.to, accept);
        if (!verdict.ok) fail(at, `'Show me' move rejected (${verdict.reason})`);
        else {
          chess = verdict.after;
          ok();
        }
      }

      if (failures > before) problems += 1;
    }

    console.log(`${problems ? "FAIL " : "ok    "} ${series.name} / ${lesson.title} (${lesson.steps.length} steps)`);
  }
}

console.log(`\n${TACTIC_SERIES.length} tactics, ${seenLessons.size} lessons, ${stepCount} steps, ${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
