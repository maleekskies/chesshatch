import { supabase } from "./supabaseClient.js";
import { DEFAULT_RATING, updateBothPlayers } from "./glicko2.js";

export async function getRating(userId, timeControl) {
  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("user_id", userId)
    .eq("time_control", timeControl)
    .maybeSingle();
  if (data) return data;
  return { user_id: userId, time_control: timeControl, ...DEFAULT_RATING, games_played: 0 };
}

export async function getAllRatings(userId) {
  const { data } = await supabase.from("ratings").select("*").eq("user_id", userId);
  return data || [];
}

// Applies a Glicko-2 update for both players after a completed game and
// writes it back. HONEST LIMITATION: since this is a client-only app
// with no game server, each client computes and writes its OWN rating
// row, there's no server verifying the reported result actually
// happened, so this trusts both clients to report honestly. Fine for a
// small closed beta among people who know each other; would need a
// server-side function (e.g. a Supabase Edge Function) to be cheat-
// resistant for a public product later.
export async function applyRatingUpdate({ whiteId, blackId, timeControl, result }) {
  const [whiteRating, blackRating] = await Promise.all([
    getRating(whiteId, timeControl),
    getRating(blackId, timeControl),
  ]);

  const updated = updateBothPlayers(
    { rating: whiteRating.rating, rd: whiteRating.rd, volatility: whiteRating.volatility },
    { rating: blackRating.rating, rd: blackRating.rd, volatility: blackRating.volatility },
    result
  );

  return {
    white: { before: whiteRating, after: updated.white },
    black: { before: blackRating, after: updated.black },
  };
}

export async function saveOwnRating(userId, timeControl, ratingResult, gamesPlayed) {
  await supabase.from("ratings").upsert({
    user_id: userId,
    time_control: timeControl,
    rating: ratingResult.rating,
    rd: ratingResult.rd,
    volatility: ratingResult.volatility,
    games_played: gamesPlayed + 1,
    updated_at: new Date().toISOString(),
  });
}
