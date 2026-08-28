// Minimal SM-2-lite scheduler. Deliberately simpler than full SM-2.
// this is for a handful of tactic puzzles per beginner, not thousands
// of flashcards, so a lighter formula is easier to reason about and
// good enough at this scale.
//
// Honest limitation: this surfaces "due for review" items when the
// learner opens the app (client-side, checked against Supabase data).
// It does NOT send push notifications or emails, that needs a backend
// cron job and an email/push service, which is a real infrastructure
// piece beyond what a client-side app can do alone. If email reminders
// matter later, a Supabase Edge Function on a schedule (pg_cron +
// Resend/similar) is the standard way to add that on top of this.

export function nextReview({ wasCorrect, previousIntervalDays = 1, previousEase = 2.3 }) {
  let ease = previousEase;
  let interval = previousIntervalDays;

  if (wasCorrect) {
    ease = Math.min(3.0, ease + 0.1);
    interval = Math.round(interval * ease) || 1;
  } else {
    ease = Math.max(1.3, ease - 0.2);
    interval = 1; // wrong answer, see it again tomorrow, not in a week
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { ease, intervalDays: interval, nextReviewAt: nextReviewAt.toISOString() };
}
