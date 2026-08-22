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



`src/lib/stockfish.js` loads the engine via:
```js
new Worker(new URL("stockfish/src/stockfish-nnue-16.js", import.meta.url))
```
This is the standard Vite pattern for bundling a worker from an npm
package, and matches how the `stockfish` package is commonly structured
— but package internals do shift between versions, and this could not be
verified by actually running it in this environment (no internet access
during development). If the "vs Computer" mode doesn't respond after
`npm install`, check the actual file path inside
`node_modules/stockfish/src/` and adjust the import path in
`stockfish.js` to match — this is the single most likely spot to need a
small fix on first real run.

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


## What's new in this pass — with honest confidence levels

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
