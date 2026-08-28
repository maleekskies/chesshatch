// Offline Stockfish wrapper, runs entirely in a Web Worker in the
// browser, no network calls once the page (and this worker file) has
// loaded. This is what makes "play vs computer" work without internet.
//
// Uses the `stockfish.js` npm package (nmrugg's classic build), which is
// deliberately single-threaded, it does NOT use SharedArrayBuffer, so
// it doesn't need the Cross-Origin-Opener-Policy / Cross-Origin-Embedder-
// Policy headers that multi-threaded NNUE builds require (and that
// Vercel doesn't send by default, which is what caused the
// "SharedArrayBuffer is not defined" crash on the previous build).
// Slightly weaker top-end engine strength than the multi-threaded NNUE
// build, but that's the right trade for zero server config and no
// crash risk on a standard static host.

export function createEngine() {
  const worker = new Worker(new URL("stockfish.js/stockfish.js", import.meta.url));
  let ready = false;
  let readyResolvers = [];
  let loadFailed = false;

  worker.onerror = (e) => {
    loadFailed = true;
    console.error(
      "[ChessPath] Stockfish worker failed to load:",
      e.message || e,
      "Check that node_modules/stockfish.js/stockfish.js actually exists at that path after npm install. The exact file layout couldn't be verified without live internet access during development."
    );
  };

  worker.onmessage = (e) => {
    const line = typeof e.data === "string" ? e.data : "";
    if (line === "uciok" || line.includes("readyok")) {
      ready = true;
      readyResolvers.forEach((r) => r());
      readyResolvers = [];
    }
  };

  worker.postMessage("uci");
  worker.postMessage("isready");

  function whenReady() {
    if (ready) return Promise.resolve();
    return new Promise((resolve) => {
      readyResolvers.push(resolve);
      // Safety net: if the worker never becomes ready (e.g. the file
      // failed to load), don't hang the UI forever, resolve anyway
      // after a few seconds so getBestMove can fail visibly instead of
      // the "vs Computer" button just doing nothing with no feedback.
      setTimeout(() => {
        if (!ready) {
          console.warn("[ChessPath] Stockfish never became ready, engine moves will not work.");
          resolve();
        }
      }, 4000);
    });
  }

  // skillLevel: 0 (weakest) to 20 (full strength). Roughly maps to
  // beginner-through-strong-club-player for a teaching tool, the
  // blueprint's "graduated bot strength" from Phase 3.
  function setSkillLevel(skillLevel) {
    worker.postMessage(`setoption name Skill Level value ${Math.max(0, Math.min(20, skillLevel))}`);
  }

  /**
   * Ask the engine for its best move from a given FEN.
   * Returns a Promise<string> resolving to a move in UCI form, e.g. "e2e4".
   */
  function getBestMove(fen, { moveTimeMs = 800 } = {}) {
    return whenReady().then(() => {
      return new Promise((resolve) => {
        let settled = false;
        function handler(e) {
          const line = typeof e.data === "string" ? e.data : "";
          if (line.startsWith("bestmove")) {
            settled = true;
            worker.removeEventListener("message", handler);
            const move = line.split(" ")[1];
            resolve(move);
          }
        }
        worker.addEventListener("message", handler);
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go movetime ${moveTimeMs}`);
        // If the engine is unresponsive (failed load, etc.), don't hang
        // forever, resolve null so the caller's existing "(none)"-style
        // check handles it instead of the UI silently freezing.
        setTimeout(() => {
          if (!settled) {
            worker.removeEventListener("message", handler);
            resolve(null);
          }
        }, moveTimeMs + 3000);
      });
    });
  }

  function destroy() {
    worker.terminate();
  }

  return { setSkillLevel, getBestMove, destroy };
}

// Convenience: skill-level presets, spaced out across a full ladder from
// complete beginner to full engine strength, the blueprint's "graduated
// bot strength" made concrete. Skill Level (0-20) and think time both
// increase together so each rung actually feels harder, not just the
// same difficulty with a fancier name.
export const DIFFICULTY_PRESETS = [
  { key: "beginner", label: "Beginner", skillLevel: 0, moveTimeMs: 300 },
  { key: "novice", label: "Novice", skillLevel: 2, moveTimeMs: 350 },
  { key: "casual", label: "Casual", skillLevel: 4, moveTimeMs: 400 },
  { key: "amateur", label: "Amateur", skillLevel: 6, moveTimeMs: 500 },
  { key: "intermediate", label: "Intermediate", skillLevel: 8, moveTimeMs: 600 },
  { key: "advanced", label: "Advanced", skillLevel: 10, moveTimeMs: 700 },
  { key: "expert", label: "Expert", skillLevel: 12, moveTimeMs: 850 },
  { key: "master", label: "Master", skillLevel: 14, moveTimeMs: 1000 },
  { key: "seniorMaster", label: "Senior Master", skillLevel: 16, moveTimeMs: 1150 },
  { key: "internationalMaster", label: "Int'l Master", skillLevel: 18, moveTimeMs: 1300 },
  { key: "grandmaster", label: "Grandmaster", skillLevel: 19, moveTimeMs: 1500 },
  { key: "full", label: "Full Strength", skillLevel: 20, moveTimeMs: 1800 },
];
