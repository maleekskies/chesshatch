// Offline Stockfish wrapper — runs entirely in a Web Worker in the
// browser, no network calls once the page (and this worker file) has
// loaded. This is what makes "play vs computer" work without internet.
//
// Uses the `stockfish` npm package, which ships a WASM engine + JS glue.
// Vite bundles worker files via `new URL(..., import.meta.url)` — this
// is the standard, documented pattern for shipping web workers in a
// Vite project (not something ChessPath-specific).

export function createEngine() {
  const worker = new Worker(new URL("stockfish/src/stockfish-nnue-16.js", import.meta.url));
  let ready = false;
  let readyResolvers = [];

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
    return new Promise((resolve) => readyResolvers.push(resolve));
  }

  // skillLevel: 0 (weakest) to 20 (full strength). Roughly maps to
  // beginner-through-strong-club-player for a teaching tool — the
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
        function handler(e) {
          const line = typeof e.data === "string" ? e.data : "";
          if (line.startsWith("bestmove")) {
            worker.removeEventListener("message", handler);
            const move = line.split(" ")[1];
            resolve(move);
          }
        }
        worker.addEventListener("message", handler);
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go movetime ${moveTimeMs}`);
      });
    });
  }

  function destroy() {
    worker.terminate();
  }

  return { setSkillLevel, getBestMove, destroy };
}

// Convenience: skill-level presets matching the blueprint's tiers, so the
// UI can offer named difficulties instead of a raw 0-20 slider.
export const DIFFICULTY_PRESETS = [
  { key: "beginner", label: "Beginner", skillLevel: 1, moveTimeMs: 400 },
  { key: "casual", label: "Casual", skillLevel: 5, moveTimeMs: 600 },
  { key: "club", label: "Club Player", skillLevel: 10, moveTimeMs: 900 },
  { key: "strong", label: "Strong", skillLevel: 16, moveTimeMs: 1200 },
  { key: "full", label: "Full Strength", skillLevel: 20, moveTimeMs: 1500 },
];
