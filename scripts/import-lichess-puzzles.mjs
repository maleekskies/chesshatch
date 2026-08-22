// Import a slice of the Lichess open puzzle database (CC0 licensed)
// into Supabase's puzzle_attempts-adjacent content, replacing the small
// hand-verified sample set with real, tagged puzzles.
//
// CANNOT BE RUN FROM THIS BUILD SESSION — needs live internet access to
// download the Lichess puzzle CSV, which this sandbox doesn't have.
// Run this once from Code Desktop or your own machine, after `npm install`.
//
// Usage:
//   node scripts/import-lichess-puzzles.mjs
//
// Requires these env vars (same Supabase project, but needs the
// SERVICE ROLE key, not the public anon key, since this writes data
// directly — never expose the service role key in client-side code):
//   SUPABASE_URL=https://mvmycbhsrekrfncrsvrc.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard > Settings > API>

import { createClient } from "@supabase/supabase-js";
import { createGunzip } from "zlib";
import { createInterface } from "readline";

const LICHESS_PUZZLE_CSV_GZ = "https://database.lichess.org/lichess_db_puzzle.csv.zst";
// Note: Lichess's current export is .zst (Zstandard), not gzip — this
// script assumes a gzip re-export or that you've decompressed it first
// with a zstd tool (e.g. `zstd -d lichess_db_puzzle.csv.zst`) and point
// this script at the local .csv instead. Flagging this because it's
// exactly the kind of external-format detail that can only be confirmed
// by actually running it against the live file.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Which motifs from Lichess's puzzle themes map to ChessPath's Tier 1/2
// lesson categories — only import puzzles tagged with themes a
// beginner-to-intermediate curriculum actually uses.
const RELEVANT_THEMES = new Set([
  "pin", "fork", "skewer", "discoveredAttack", "hangingPiece",
  "backRankMate", "mateIn1", "mateIn2", "doubleCheck", "deflection",
]);
const MAX_PUZZLES_TO_IMPORT = 500; // keep the first import small and reviewable

async function importPuzzles(csvPath) {
  const fs = await import("fs");
  const stream = fs.createReadStream(csvPath);
  const rl = createInterface({ input: stream });

  let isHeader = true;
  let imported = 0;
  const rows = [];

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (imported >= MAX_PUZZLES_TO_IMPORT) break;

    // Lichess CSV columns: PuzzleId,FEN,Moves,Rating,RatingDeviation,
    // Popularity,NbPlays,Themes,GameUrl,OpeningTags
    const cols = line.split(",");
    const [puzzleId, fen, moves, rating, , , , themes] = cols;
    const themeList = (themes || "").split(" ");
    const matchedTheme = themeList.find((t) => RELEVANT_THEMES.has(t));
    if (!matchedTheme) continue;

    // Lichess puzzles give the position BEFORE the opponent's setup move;
    // the actual puzzle starts one move later. This needs verifying against
    // real rows before trusting it blindly — noted here rather than assumed.
    const firstSolutionMove = moves.split(" ")[1];
    if (!firstSolutionMove) continue;

    rows.push({
      id: `lichess-${puzzleId}`,
      motif: matchedTheme,
      fen,
      solution_squares: [firstSolutionMove.match(/.{1,2}/g).slice(0, 2).join("")],
      rating: parseInt(rating, 10) || null,
      source: "lichess",
    });
    imported++;
  }

  console.log(`Parsed ${rows.length} relevant puzzles. Writing to Supabase...`);
  const { error } = await supabase.from("imported_puzzles").upsert(rows);
  if (error) { console.error("Import failed:", error); process.exit(1); }
  console.log(`Imported ${rows.length} puzzles successfully.`);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/import-lichess-puzzles.mjs <path-to-decompressed-lichess_db_puzzle.csv>");
  process.exit(1);
}
importPuzzles(csvPath);
