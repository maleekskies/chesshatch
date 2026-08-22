# ChessPath Beta — Tester Onboarding Plan

A real testing plan, not just "here's a link, try it." The point of
testing across skill levels is to learn different things from each
group — this plan gives each group something specific to focus on so
the feedback that comes back is actually useful.

## Who to recruit, and what to ask each group

**Total beginners (never played, or barely knows the rules)**
- What to have them do: the diagnostic test, then Tier 1 start to
  finish.
- What you're actually testing: does the diagnostic correctly place
  them at the very start? Does Tier 1 make sense with zero assumed
  knowledge? Where do they get stuck or confused — this is the group
  most likely to reveal a lesson that assumes something it shouldn't.

**Casual players (knows the rules, plays occasionally online)**
- What to have them do: the diagnostic test, then whichever tier it
  places them in, then try "vs Computer" at a couple of difficulty
  levels.
- What you're testing: does the diagnostic avoid placing them back in
  Tier 1 rules basics they already know? Does the coach's feedback
  feel useful or condescending at this level?

**Club-level / stronger players**
- What to have them do: skim the diagnostic (it'll place them in
  Tier 2, since that's as far as the curriculum goes right now — tell
  them this upfront so it's not a surprise), then focus on the Tier 2
  tactics puzzles and the coach's live feedback during a practice
  game.
- What you're testing: does the coach ever say something a strong
  player would consider wrong or oversimplified? This group is your
  best check on whether the coach logic holds up, since they'll catch
  a bad take immediately.

## What to tell every tester before they start

- This is an early beta — pieces, puzzles, and lessons will change.
- The diagnostic is a short sample (6 questions), not the full
  version yet — don't read too much into the exact tier it gives.
- There's a feedback button (bottom-right corner) on every screen —
  ask them to use it in the moment something's confusing, rather than
  waiting to remember it later.
- Tell them explicitly: "wrong" or "confusing" feedback is more useful
  than "looks good" — they don't need to be polite about it.

## What to look at afterward

- Feedback table in Supabase — read every entry, note which screen
  each one came from.
- `diagnostic_results` — do real testers' tiers roughly match what you'd
  expect from talking to them? A mismatch here means the 6-question
  sample isn't discriminating well.
- `progress` — where does completion drop off? A lesson everyone
  finishes but the next one nobody starts is worth a closer look.

## After this round

Once you've got a few testers through this, the two most useful next
steps are: (1) expanding Tier 1/2 content based on where testers got
stuck, and (2) deciding whether the diagnostic needs more than 6
questions before showing it to anyone outside this small group.
