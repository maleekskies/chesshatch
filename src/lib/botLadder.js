// The bot ladder: the progression path behind the "Intermediate"
// section on the landing page.
//
// One important framing note, repeated in the UI itself: these names
// are game progression labels, the same way a game has difficulty
// tiers. They are NOT claims about real playing strength and they are
// not official FIDE ratings or titles. A player beating the
// "Grandmaster" bot here has beaten an offline engine set to a
// difficulty label, nothing more.
//
// Each rung maps onto a skill level for the same offline Stockfish
// engine Play.jsx already uses (see src/lib/stockfish.js), so there is
// no second chess engine and no second set of rules in the app.
export const BOT_LADDER = [
  { key: "beginner", name: "Beginner", skillLevel: 0, moveTimeMs: 250 },
  { key: "novice", name: "Novice", skillLevel: 2, moveTimeMs: 300 },
  { key: "amateur", name: "Amateur", skillLevel: 5, moveTimeMs: 400 },
  { key: "intermediate", name: "Intermediate", skillLevel: 8, moveTimeMs: 500 },
  { key: "expert", name: "Expert", skillLevel: 11, moveTimeMs: 650 },
  { key: "candidate-master", name: "Candidate Master", skillLevel: 13, moveTimeMs: 800 },
  { key: "master", name: "Master", skillLevel: 15, moveTimeMs: 950 },
  { key: "international-master", name: "International Master", skillLevel: 17, moveTimeMs: 1100 },
  { key: "grandmaster", name: "Grandmaster", skillLevel: 19, moveTimeMs: 1300 },
];

// Progress is "how many rungs are unlocked", stored per browser in
// localStorage under the same chessloop_* namespace the streak counter
// and walkthrough flag already use. It is deliberately a count rather
// than a set of keys: a count can only ever describe a contiguous run
// from the start, which is exactly the "no skipping levels" rule, so
// there is no way to persist a gap even by hand-editing storage.
export const BOT_PROGRESS_KEY = "chessloop_bot_level";

export function readUnlockedCount() {
  try {
    const raw = parseInt(localStorage.getItem(BOT_PROGRESS_KEY) || "1", 10);
    if (!Number.isFinite(raw)) return 1;
    return Math.min(Math.max(raw, 1), BOT_LADDER.length);
  } catch {
    return 1; // localStorage unavailable, start at Beginner
  }
}

export function writeUnlockedCount(count) {
  const clamped = Math.min(Math.max(count, 1), BOT_LADDER.length);
  try { localStorage.setItem(BOT_PROGRESS_KEY, String(clamped)); } catch { /* not persisted, still works this session */ }
  return clamped;
}

export function resetBotProgress() {
  try { localStorage.removeItem(BOT_PROGRESS_KEY); } catch { /* nothing to clear */ }
  return 1;
}

export function isUnlocked(levelKey, unlockedCount) {
  const index = BOT_LADDER.findIndex((l) => l.key === levelKey);
  return index >= 0 && index < unlockedCount;
}

// The player is always White in a ladder game, so a finished game has
// exactly one meaning: mate delivered by White is a win and unlocks
// the next rung, mate delivered by Black is a loss, anything else
// (stalemate, threefold repetition, insufficient material, the fifty
// move rule) is a draw. Neither of those last two ever advances the
// ladder. Kept here as a plain function of a chess.js instance so the
// rule that decides unlocking can be tested on its own, without a
// browser or a live engine.
export const PLAYER_COLOR = "w";

export function outcomeOf(chess) {
  if (!chess.isGameOver()) return null;
  if (!chess.isCheckmate()) return "draw";
  return chess.turn() === PLAYER_COLOR ? "loss" : "win";
}
