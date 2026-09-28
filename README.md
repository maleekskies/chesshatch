# ChessHatch

A free chess learning platform for complete beginners through advanced
players, learning-first rather than play-first. Vite + React frontend,
live Supabase backend (Postgres + Auth, RLS on every table), chess.js
for move validation, react-chessboard for the board UI, offline
Stockfish for computer play, and a rule-based live coach. Closed beta,
no monetization.

## Getting started

(Needs internet access: your own machine, Claude Code Desktop, or
any dev environment with npm.)

1. Install dependencies:
   npm install

2. Supabase is already live: `.env.local` has the real project URL and
   key wired in (project: chesspath). Nothing to configure. Auth URL
   Configuration (Site URL + Redirect URLs) is already set in the
   Supabase dashboard to point at the deployed Vercel URL and
   localhost:5173.

3. Start the dev server:
   npm run dev
   - Opens at `http://localhost:5173`
   - `server.host: true` in vite.config.js means you can also open it
     on your phone over WiFi at `http://<your-computer's-local-IP>:5173`.
     That's the real way to test the mobile layout and the PWA install
     prompt.

4. Deploy (Vercel, free tier):
   - Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
     must be set in Vercel's Project Settings under Environment
     Variables. `.env.local` is gitignored and never deploys
     automatically.
   - If deploying via drag-and-drop ("Vercel Drop") rather than a
     connected GitHub repo, you must re-drop the folder after adding
     env vars to trigger a new build, since there's no auto-redeploy
     without Git.

## What's here

### App shell

- `src/App.jsx`: nav, landing page, diagnostic quiz, results screen,
  routing, the first-visit nav walkthrough, and the badge-earned toast.
- `src/main.jsx`: entry point, crash error boundary, service worker
  registration.

### Screens (`src/screens/`)

- `Lessons.jsx`: Tier 1 (18 lessons) and Tier 2 (4 lessons) flow.
  Movement lessons and Q&A lessons end straight in a "got it, continue."
  Puzzle-based lessons flow into a matched puzzle. Also owns the
  zero-knowledge "jump straight to Lesson 1" entry point and links out
  to the mistakes and glossary pages.
- `Play.jsx`: Practice mode (pass-and-play with the live coach) and vs
  Computer mode (offline Stockfish, 12 difficulty presets).
- `GuidedGame.jsx`: a scripted 10-ply mini-match (the Italian Game
  opening) for a total beginner's first hands-on game. The player plays
  every White move themselves. Black's replies are scripted and
  auto-play with a short pause. The coach narrates every move on both
  sides.
- `LiveMatch.jsx`: real-time matches between two signed-in testers via
  Supabase Realtime, with time controls, Glicko-2 ratings, and a
  post-game coach review.
- `PuzzleRush.jsx`: 90-second timed puzzle streak.
- `Profile.jsx`: ratings, lessons mastered, best Puzzle Rush streak,
  latest diagnostic tier, and the badges grid (earned badges in color,
  unearned ones grayed out).
- `BeginnerMistakes.jsx`: a static reference page of 8 common beginner
  mistakes (what it is, why it hurts, what to do instead).
- `Glossary.jsx`: a searchable, alphabetized version of the same term
  definitions that already power the inline hover tooltips.
- `Admin.jsx`: tester counts, tier distribution, feedback, gated to one
  admin email.
- `Privacy.jsx`: plain-language privacy statement.

### Shared components (`src/components/`)

- `ChessBoard.jsx`: the react-chessboard wrapper every screen uses.
  Owns move interaction centrally: drag-and-drop, click-to-move (click
  a piece to select it, its legal destinations highlight, then click
  where to move it), and a guaranteed snap-back on any illegal drop,
  checked against the position's actual legal moves before it ever
  reaches the screen's own move handler. Uses the library's default
  piece set, the same visual family as Lichess and Chess.com, not
  anything custom-drawn.
- `PromotionPicker.jsx`: real piece choice on promotion.
- `Term.jsx`: inline glossary tooltip.
- `FeedbackButton.jsx`: floating feedback button on every screen,
  writes to the `feedback` table with which screen the person was on.

### Core logic (`src/lib/`)

- `coach.js`: after every move, checks whether the piece that just
  moved is attacked and undefended, and flags unfavorable trades.
  Independent of chess.js's turn-based move generator on purpose,
  since "is this square defended" needs checking for either color
  regardless of whose turn it is.
- `stockfish.js`: Web Worker wrapper around the `stockfish.js` package
  (single-threaded, no `SharedArrayBuffer` requirement). Runs entirely
  client-side once loaded, with no network calls during play.
- `glicko2.js`: the same rating algorithm Lichess uses, implemented
  from Glickman's published spec and checked with real sanity tests
  before shipping (a lower-rated win raises rating, a loss lowers it,
  an equal-rating draw barely moves it).
- `spacedRepetition.js`: SM-2-lite scheduler for puzzle review dates.
- `liveMatch.js`: Supabase Realtime channel wrapper (move, resign,
  draw offer and response, timeout, rating-share events).
- `clock.js`: countdown and formatting for Live Match time controls.
- `ratings.js`: fetch and update helpers for the `ratings` table.
- `badges.js`: the 8-badge catalog and award logic. localStorage-first
  (works instantly for guests too), with best-effort background sync
  to Supabase for signed-in users.
- `supabaseClient.js`: Supabase client init, with a graceful fallback
  if env vars are missing instead of a hard crash.

### Content data (`src/data/`)

- `lessons.js`: Tier 1 (18 lessons: all 6 piece movements, piece
  values, trading, check and checkmate, back-rank mate, pin, fork, and
  6 question-and-answer rules lessons) and Tier 2 (4 lessons). Every
  FEN and solution move was hand-verified with an independent move
  checker before being written, not just eyeballed. Two of the original
  piece-movement lessons (knight and bishop) originally shipped with
  bare-board FENs that had no kings at all, which crashed the whole
  app on load. Both are now fixed, and the checker that caught it is
  described in "Honest limitations" below.
- `guidedGame.js`: the guided first game's script. Every one of the 10
  moves was independently verified legal (piece movement, path
  blocking, castling rights and path and king safety) with a
  from-scratch Python legality checker before being written here. No
  chess library was available offline in the environment this was
  built in, so the checker was hand-rolled and itself tested against
  known-illegal moves to confirm it actually rejects bad input.
- `beginnerMistakes.js`: the 8 entries behind the mistakes page.
  General strategic principles, not specific move sequences, so unlike
  the guided game there's no board position here needing legality
  verification.
- `glossary.js`: term definitions, shared by the inline tooltips and
  the dedicated glossary page.

### PWA (`public/`)

- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, and
  `apple-touch-icon.png` provide installability. The icon is a plain
  navy and gold monogram generated with `sharp`, deliberately not a
  hand-drawn chess piece. This project already replaced one earlier
  round of "AI slop" hand-drawn pieces with react-chessboard's real
  artwork, and an app icon is exactly the kind of asset where a
  hand-drawn attempt risks the same result.
- `sw.js`: hand-rolled service worker (no build plugin was available
  offline). This is runtime caching, not a build-time precache
  manifest: the app becomes installable immediately, and becomes
  usable offline once you've opened it online at least once. It is
  not offline-capable from a completely fresh install with zero prior
  network access.

### Database

`supabase/schema.sql`, already applied to the live project as
migrations:

- `profiles`, `diagnostic_results`, `progress`, `puzzle_attempts` (with
  `next_review_at`, `interval_days`, and `ease` for spaced repetition),
  `feedback`, `imported_puzzles`, `ratings`, `games`,
  `puzzle_rush_scores`, `badges_earned`. RLS enabled on every table,
  scoped to each user's own rows.

### Other

- `scripts/import-lichess-puzzles.mjs`: replaces the small hand-
  verified puzzle sample with the full tagged Lichess open puzzle
  database (CC0). See "Honest limitations" below for why it hasn't
  been run yet.
- `TESTER_ONBOARDING.md`: a real, usable plan for what testers at
  different skill levels should focus on, not a placeholder.

## Honest limitations

These are real, current constraints, not disclaimers to skip over:

- **Live Match clocks are not server-authoritative.** Each client runs
  its own local countdown, resynced on every move. Fine for a small
  trusted beta, not cheat-proof.
- **Ratings are self-reported.** There's no game server, so each
  player's browser computes and writes its own updated rating after a
  game. Same trust model as the clocks above.
- **Badges are the same trust model.** localStorage-first, best-effort
  Supabase sync. Not something to build a public leaderboard on
  without a server-side check.
- **Streak counter is per-browser**, stored in localStorage rather
  than tied to an account, so it resets on a different device or with
  cleared browser data.
- **Spaced repetition surfaces reviews when the app is opened**, not
  via push notification or email. That needs a backend cron job and a
  notification service, real infrastructure beyond a client-side app.
- **Puzzle Rush and the daily puzzle draw from a small hand-verified
  sample** (a handful of puzzles) until the Lichess import script
  (`scripts/import-lichess-puzzles.mjs`) actually runs. It's real and
  complete but needs internet access and a Supabase service-role key,
  neither available in the environment this was built in.
- **The diagnostic quiz is text-based multiple choice**, not yet the
  100-plus verified chess positions per level that were requested.
  Building and independently verifying hundreds of unique tactical
  positions, at the same rigor as every FEN elsewhere in this project,
  is a genuinely large content undertaking well beyond what a single
  working session can responsibly deliver without cutting corners on
  verification. That work has not been started yet rather than being
  faked with unverified content.
- **"vs Computer" mode has no clock.** Time controls were built where
  they matter most first, for human-vs-human ratings, and haven't been
  retrofitted everywhere yet.
- **Simplified nav for new accounts can flash briefly** for a
  returning signed-in user with real progress. The nav starts
  simplified and expands once their lesson history loads from
  Supabase.
- **PWA offline support is runtime-cached, not precached.** See the
  `sw.js` note above.
- **Accessibility is a basic pass, not full keyboard-only play.**
  There are landmark roles and an `aria-live` region on the coach's
  messages, but full keyboard chess-move input is a genuinely larger
  piece of work not built yet.
- **URL-based routing has not been added yet.** Every screen is still
  a JavaScript state variable rather than a real URL, so the browser's
  back and forward buttons don't move between screens inside the app,
  and refreshing the page always returns to the landing screen.
  `react-router-dom` is already a project dependency but isn't wired
  up yet.
- **Everything chess-related that ships here was independently
  verified before being written.** Lesson FENs, the guided game's
  moves, the Glicko-2 math, all using hand-rolled checkers where no
  chess library was available offline, specifically because a wrong
  position or an illegal "legal" move actively mis-teaches a beginner.
  Where that verification wasn't possible (Lichess puzzle import, live
  two-client Realtime sync), that's flagged above and in the code
  rather than assumed to work.

## Next steps

- Real URL-based routing with `react-router-dom`, so back and forward
  work and a refresh doesn't drop the person back at the landing page
- Build the diagnostic quiz out toward genuinely verified,
  position-based questions at real scale, rather than the current
  small set of text trivia questions
- Run the Lichess puzzle import to replace the small hand-verified
  sample with the full tagged puzzle database
- Server-side (Supabase Edge Function) rating and badge verification,
  so neither can be spoofed by a modified client
- Server-authoritative Live Match clocks
- A clock for "vs Computer" mode
- Broadcast the host's time-control choice to the guest on Live Match
  join, instead of relying on agreeing out of band
- Expand Tier 2 with more motifs (skewers, discovered attacks) and
  start on Tier 3
- Full keyboard-only move input for accessibility
- A build-time precache manifest for the service worker (would need a
  PWA build plugin, not installable offline in this environment)
