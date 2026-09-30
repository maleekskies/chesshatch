# Chess Hatch Beta: Tester Onboarding Plan

A real testing plan, not just "here's a link, try it." The point of
testing across skill levels is to learn different things from each
group. This plan gives each group something specific to focus on so
the feedback that comes back is actually useful.

## Who to recruit, and what to ask each group

### Total beginners (never played, or barely knows the rules)

- What to have them do: the "Start from zero" course (Tier 1), start to
  finish.
- What you're actually testing: does the course make sense with zero
  assumed knowledge? Where do they get stuck or confused? This is the
  group most likely to reveal a lesson that assumes something it
  shouldn't.

### Casual players (knows the rules, plays occasionally online)

- What to have them do: the "Intermediate" bot ladder on the home page,
  from Beginner upward, then try "vs Computer" at a couple of
  difficulty levels.
- What you're testing: does the ladder feel like a real progression, or
  does the first rung feel pointless to someone who already plays? Does
  the unlock step work reliably — does a win always unlock the next
  level, and does a loss or a draw never unlock anything? Does the
  coach's feedback feel useful or condescending at this level?

### Club-level or stronger players

- What to have them do: go straight to Tier 2 (tell them upfront that
  it's as far as the curriculum goes right now), then focus on the Tier
  2 tactics puzzles and the coach's live feedback during a practice
  game.
- What you're testing: does the coach ever say something a strong
  player would consider wrong or oversimplified? This group is your
  best check on whether the coach logic holds up, since they'll catch
  a bad take immediately.

## What to tell every tester before they start

- This is an early beta, pieces, puzzles, and lessons will change.
- The bot ladder's level names are progression labels for this app, not
  official ratings or titles. A win against the current level unlocks
  the next one; a loss or a draw changes nothing.
- There's a feedback button (bottom-right corner) on every screen.
  Ask them to use it in the moment something's confusing, rather than
  waiting to remember it later.
- Tell them explicitly: "wrong" or "confusing" feedback is more useful
  than "looks good", they don't need to be polite about it.

## What to look at afterward

- Feedback table in Supabase, read every entry, note which screen
  each one came from.
- `progress`: where does completion drop off? A lesson everyone
  finishes but the next one nobody starts is worth a closer look.
- Ask each tester where they got to on the bot ladder (it's stored
  per browser, so ask them rather than reading it from the database).
  A rung nobody clears is worth a closer look at its difficulty.

## After this round

Once you've got a few testers through this, the two most useful next
steps are: (1) expanding Tier 1/2 lesson content based on where
testers got stuck, and (2) calibrating the bot ladder so each rung
represents a similar amount of improvement, instead of the current
straight mapping onto Stockfish skill levels.
