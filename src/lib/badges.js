import { supabase } from "./supabaseClient.js";

// Badge catalog. `icon` is a plain emoji rather than a component so this
// file has zero UI dependencies and can be safely imported from any
// screen without pulling in extra bundle weight.
export const BADGES = {
  first_lesson: { label: "First Lesson", desc: "Completed your first lesson.", icon: "📘" },
  first_puzzle: { label: "First Puzzle", desc: "Solved your first puzzle.", icon: "🧩" },
  first_game: { label: "First Game", desc: "Finished your first game.", icon: "🏁" },
  first_checkmate: { label: "First Checkmate", desc: "Delivered your first checkmate.", icon: "♚" },
  first_live_match: { label: "First Live Match", desc: "Played your first rated Live Match.", icon: "⚔️" },
  tier1_complete: { label: "Tier 1 Complete", desc: "Mastered every Tier 1 lesson.", icon: "🎓" },
  streak_3: { label: "3-Day Streak", desc: "Practiced 3 days in a row.", icon: "🔥" },
  streak_7: { label: "7-Day Streak", desc: "Practiced 7 days in a row.", icon: "🔥" },
};

const STORAGE_KEY = "chessloop_badges";

export function getEarnedBadges() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

// Records a badge as earned and returns the badge key if this is the
// FIRST time it's been earned (so the caller knows to celebrate it), or
// null if it was already earned before or isn't a real badge key.
//
// HONEST LIMITATION: like ratings elsewhere in this app, this is a
// client-only write, localStorage is the source of truth (so it works
// instantly for guests too), and for signed-in users it's mirrored to
// Supabase best-effort in the background. There's no server check that
// the badge was actually earned fairly; fine for a closed beta, not
// something to build a real leaderboard on top of later without a
// server-side check.
export function awardBadge(key, session) {
  if (!BADGES[key]) return null;
  const earned = getEarnedBadges();
  if (earned.has(key)) return null;
  earned.add(key);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned])); } catch { /* localStorage unavailable */ }

  if (session?.user) {
    supabase.from("badges_earned")
      .upsert({ user_id: session.user.id, badge_key: key }, { onConflict: "user_id,badge_key" })
      .then(() => {}, () => {});
  }
  return key;
}
