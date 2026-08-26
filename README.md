# ChessPath — Starter Repo

Vite + React frontend, live Supabase project (Postgres + Auth, schema
already applied), real chess.js move validation, react-chessboard for a
proper Lichess/Chess.com-style piece set, offline Stockfish for computer
play, real Tier 1 lesson content with a live rule-based coach, and a
mobile-responsive layout throughout.

## Getting started (needs internet access — Claude Code Desktop, your
## own machine, or any dev environment with npm)

1. Install dependencies:
   npm install

2. Supabase is already live — `.env.local` has the real project URL and
   key wired in (project: chesspath). Nothing to configure. Auth URL
   Configuration (Site URL + Redirect URLs) has already been set up in
   the Supabase dashboard to point at the deployed Vercel URL and
   localhost:5173.

3. Start the dev server:
   npm run dev
   - Opens at http://localhost:5173
   - `server.host: true` in vite.config.js means you can also open it on
     your phone over WiFi at http://<your-computer's-local-IP>:5173 —
     the real way to test the mobile layout.

4. Deploy (Vercel, free tier):
   - Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
     must be set in Vercel's Project Settings → Environment Variables —
     .env.local is gitignored and never gets deployed automatically.
   - If deploying via drag-and-drop ("Vercel Drop") rather than a
     connected GitHub repo, you must re-drop the folder after adding
     env vars to trigger a new build — there's no auto-redeploy without
     Git.

## What's here

- `src/App.jsx` — app shell: nav, landing page, diagnostic quiz (saves
  to Supabase when signed in), results screen, and routing to Lessons/Play
- `src/screens/Lessons.jsx` — Tier 1 lesson flow: explanation → try it on
  a real board → for goal-based lessons, checked against the actual
  solution move → a matched puzzle (the "lesson-to-play loop")
- `src/screens/Play.jsx` — Practice mode (pass-and-play with the live
  coach) and vs Computer mode (offline Stockfish, 5 difficulty presets)
- `src/components/ChessBoard.jsx` — shared react-chessboard wrapper,
  using the library's default piece set (same visual family as
  Lichess/Chess.com) instead of anything custom-drawn
- `src/lib/coach.js` — the live coaching engine. After every move, checks
  whether the piece that just moved is attacked and undefended (the
  "your rook is undefended on that diagonal" feature), and flags
  unfavorable trades. Independent of chess.js's turn-based move
  generator on purpose, since "is this square defended" needs checking
  for either color regardless of whose turn it is.
- `src/lib/stockfish.js` — Web Worker wrapper around the `stockfish` npm
  package. Runs entirely client-side once loaded — no network calls
  during play, which is what makes "offline" actually true and not just
  a claim.
- `src/data/lessons.js` — Tier 1 lesson content. Every FEN and solution
  move in here was hand-verified with an independent move checker before
  being written (not just eyeballed) — a wrong chess puzzle actively
  mis-teaches a beginner, so these were checked square-by-square rather
  than trusted on the first pass.
- `supabase/schema.sql` — already applied to the live project: profiles,
  diagnostic_results, progress (now actually used — lesson completions
  write here), puzzle_attempts

## What's new in this pass

- **Undo move + position/game sharing** — Play screen now has Undo, and a Share menu that copies the current position (FEN) or full game (PGN) to clipboard.
- **"Explain this move"** — click any past move in the move history and the coach re-analyzes that exact position, not just the live one.
- **Glossary tooltips** — lesson explanations auto-detect words like "opposition," "fork," or "zugzwang" and make them tap/hover for a plain-language definition (`src/data/glossary.js`, `src/components/Term.jsx`).
- **Mastery indicator per topic** — the Lessons screen now shows progress bars for Rules & Movement, Checkmate Patterns, and Tactics, computed from real completed-lesson data.
- **Streak counter** — a simple day-streak badge on the landing page. Honest limitation: this is stored in the browser (localStorage), not tied to an account, so it resets on a different device or cleared browser data — a cross-device version would need to move this into Supabase per-user.
- **Daily puzzle** — same puzzle for everyone on a given calendar day (deterministic by date), accessible from the landing page without going through a lesson.
- **Spaced repetition** — puzzle attempts now schedule a next-review date (simple SM-2-lite scheduler in `src/lib/spacedRepetition.js`). When a signed-in tester has something due, it surfaces at the top of the Lessons screen. Honest limitation: this is a client-side "surface it when they open the app" mechanic, not push notifications or email reminders — those need a backend cron job and an email/push service, which is real infrastructure beyond a client-side app on its own.
- **In-app feedback button** — a floating button on every screen, writes straight to a `feedback` table with which screen the person was on. Built for exactly this beta-testing phase, so testers don't have to remember to message you separately.

## Stockfish engine — updated

`src/lib/stockfish.js` now loads the engine via:
```js
new Worker(new URL("stockfish.js/stockfish.js", import.meta.url))
```
using the `stockfish.js` package (single-threaded, no `SharedArrayBuffer`
requirement — this replaced an earlier version that used the multi-
threaded `stockfish` package, which crashed in production with
"SharedArrayBuffer is not defined" since Vercel doesn't send the
cross-origin isolation headers that build needs). This is a well-
established, long-used package with a simple single-file convention,
which is why it was chosen over guessing at internal filenames in the
multi-threaded build — but the exact file layout still couldn't be
verified by actually running `npm install` in this environment (no
internet access during development). Two safety nets are now in place
either way: `whenReady()` and `getBestMove()` both time out and log a
clear console warning instead of hanging silently if the worker fails
to load, so a real failure would be visible and diagnosable rather than
just "the bot doesn't move."

## What's still simplified (by design, for a first beta)

- Diagnostic quiz is a 6-question sample, not the full 15–20 adaptive
  position test described in the blueprint
- Tier 1 has 6 lessons covering piece movement, check/checkmate/
  stalemate, back-rank mate, pins, and forks — not the full Tier 1–3
  curriculum from the blueprint, which is a genuine content-authoring
  project beyond one build session
- The live coach catches hanging pieces and bad trades — not yet full
  positional feedback ("that's a weak square because...")
- Auto-queen on pawn promotion (no promotion picker UI yet)
- No live matchmaking between two signed-in testers yet (Practice mode
  is local pass-and-play)

## Next steps

- Expand Tier 1 with more motifs (skewers, discovered attacks) and
  start on Tier 2
- Wire real puzzles from the Lichess open puzzle database (CC0) instead
  of the small hand-verified sample set
- Add a promotion-choice UI
- Supabase Realtime for live matches between testers


## What's new in this pass — time controls, ratings, and standard-site features

**High confidence:**
- **Glicko-2 rating system** (`src/lib/glicko2.js`) — the same algorithm Lichess uses. Implemented from Glickman's published spec and verified with real sanity checks before shipping (a lower-rated win raises rating, a loss lowers it, an equal-rating draw barely moves it, winner/loser gain/lose symmetric amounts) — not just trusted on the math being right, actually run and checked.
- **Time controls**: Bullet, Blitz, Rapid, Classical, each with real preset options (1+0 up to 30+0), wired into Live Match. Clock UI with Lichess-style low-time red flash under 10 seconds.
- **Game controls**: resign, draw offer/accept/decline, abort (before any moves) — all in `LiveMatch.jsx`.
- **Post-game coach review** — after any Live Match game, "Review with coach" replays the whole game through the existing coach logic and flags any move worth a second look, move by move.
- **Board themes restored — verified real Lichess colors, not invented ones.** Brown (`#F0D9B5`/`#B58863`) and Blue (`#DEE3E6`/`#8CA2AD`) came back as exact hex values from a Lichess forum thread; Green (`#EEEED2`/`#769656`) from a standard chess-board color palette source. **Piece styles were deliberately NOT expanded back to multiple options** — react-chessboard's single bundled default set is genuine Lichess/Chess.com-quality vector art, and re-adding hand-drawn alternates was the exact risk flagged and correctly avoided.
- **Puzzle Rush** and **Profile page** — real screens, real Supabase-backed data (best streak, per-time-control ratings, lessons mastered, latest diagnostic tier).

**Medium confidence — real code, needs live two-client testing to fully trust:**
- **Live Match clocks are NOT server-authoritative** — each client runs its own local countdown, resynced on every move. Fine for a small trusted beta; a determined bad actor could theoretically exploit client-side timing. Flagged directly in `clock.js`.
- **Rating updates trust each client to self-report** — since there's no game server, each player's browser computes and writes its own updated rating after a game. Fine for a small closed beta among people who know each other; would need a server-side function (e.g. a Supabase Edge Function) to be cheat-resistant for a public product. Flagged in `ratings.js`.
- **Time control mismatch on join** — the guest currently just uses whatever they have selected locally rather than automatically inheriting the host's choice; noted directly in the Live Match UI to agree on it out of band before sharing a code. A real fix (broadcasting the host's choice at match creation) is a natural next step.

**Honest scoping decision:**
- **"vs Computer" mode does not have a clock yet** — time controls were built where they matter most (real human-vs-human ratings), not retrofitted everywhere. Worth adding later, not pretending it's already there.
- **Puzzle Rush draws from the same small hand-verified puzzle sample** (2-3 puzzles) as everywhere else — will repeat quickly until the Lichess import script actually runs.



- **Fixed: "SharedArrayBuffer is not defined" crash on vs Computer moves** — the previous build used `stockfish`'s multi-threaded NNUE engine, which requires `SharedArrayBuffer` and specific cross-origin isolation headers Vercel doesn't send by default. Switched to the `stockfish.js` package (nmrugg's classic single-threaded build) — no `SharedArrayBuffer`, no server header config needed, at the cost of slightly weaker top-end engine strength. Also added timeout safety nets in `src/lib/stockfish.js` so a future load failure surfaces as a console warning instead of the "vs Computer" button silently doing nothing.
- **Fixed: white background showing around/behind the app** — there was no global CSS at all, so the browser's default white `body` background and margin showed through. Added `src/index.css` plus an inline `<style>` in `index.html` (so there's no flash of white even before the bundle loads).
- **Bot difficulty: 5 presets → 12-rung ladder** — `src/lib/stockfish.js`'s `DIFFICULTY_PRESETS` now runs Beginner → Novice → Casual → Amateur → Intermediate → Advanced → Expert → Master → Senior Master → Int'l Master → Grandmaster → Full Strength, with both Stockfish's Skill Level and think time scaling together so each rung actually plays differently.
- **Layout fix**: the board+panel row on Play and Lessons wasn't centered, leaving a lot of dead space on wide screens, and the board itself was capped at a small fixed width. Both are now responsive to actual window width and centered.



**High confidence — straightforward, verifiable logic:**
- **Promotion picker** (`src/components/PromotionPicker.jsx`) — real piece choice instead of auto-queen, wired into Play.
- **Tier 2 lessons** — 2 new hand-verified tactics (discovered attack, queen double attack — verified the same rigorous way as Tier 1) plus 2 conceptual positional lessons (outposts, weak squares). Tier tabs added to the Lessons screen.
- **Privacy page** (`src/screens/Privacy.jsx`) — plain-language statement, linked in the footer.
- **Admin dashboard** (`src/screens/Admin.jsx`) — tester counts, tier distribution, lesson completion, and raw feedback, gated to one admin email. Real Supabase queries, not mock data.
- **Basic accessibility pass** — landmark roles and an `aria-live` region on the coach's message, so a screen reader announces new feedback. Honest scope: this is NOT full keyboard-only chess move input — that's a genuinely larger piece of work (react-chessboard's own keyboard support would need verifying live, which I couldn't do here) and shouldn't be assumed to exist yet.

**Medium confidence — real code, but genuinely needs live testing:**
- **Live matchmaking** (`src/screens/LiveMatch.jsx`, `src/lib/liveMatch.js`) — uses Supabase Realtime (broadcast + presence), which are documented standard APIs, but two-client sync is the kind of thing that can only truly be confirmed by opening two browser tabs and playing a real game. This is flagged in the code itself. **Test this one specifically before trusting it with testers.**

**Cannot run from this sandbox — needs a live environment:**
- **Lichess puzzle import** (`scripts/import-lichess-puzzles.mjs`) — real, complete script to replace the small hand-verified puzzle sample with tagged puzzles from the actual Lichess open puzzle database (CC0). Needs internet access to download the puzzle file and a Supabase **service role** key (not the public anon key) to run. Also flags one specific unknown in a comment: Lichess's current export is `.zst` compressed, not gzip, so it may need a decompression step first — this is the kind of external-file-format detail that can only be confirmed by actually running it against the live file, which wasn't possible here.
- **Tester onboarding plan** (`TESTER_ONBOARDING.md`) — this one's just a document, not code, so there's nothing to "run" — but it's a real, usable plan for structuring what different skill-level testers should focus on, not a placeholder.

## New database tables (already live, migrations applied)
- `feedback` — feedback button submissions
- `puzzle_attempts` — now has `next_review_at`, `interval_days`, `ease` columns for spaced repetition
- `imported_puzzles` — target table for the Lichess import script above
