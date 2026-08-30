// One-time migration from the old "chesspath_*" localStorage key names
// to "chessloop_*", after the app was renamed from ChessPath to
// ChessLoop. Copies each old key's value across (without overwriting
// an existing new-key value, in case this somehow runs twice) and
// removes the old key, so testers who already used the app keep their
// streak, badges, and preferences instead of the rename silently
// resetting everything.
//
// This module has no exports. Importing it is for its side effect,
// and it must be imported before anything else reads these keys, see
// the top of main.jsx.
const KEY_RENAMES = [
  ["chesspath_last_visit", "chessloop_last_visit"],
  ["chesspath_streak", "chessloop_streak"],
  ["chesspath_walkthrough_dismissed", "chessloop_walkthrough_dismissed"],
  ["chesspath_feedback_mode", "chessloop_feedback_mode"],
  ["chesspath_badges", "chessloop_badges"],
];

try {
  for (const [oldKey, newKey] of KEY_RENAMES) {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null) {
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, oldValue);
      }
      localStorage.removeItem(oldKey);
    }
  }
} catch {
  // localStorage unavailable (private browsing, disabled, etc.), no
  // migration possible, but nothing worth crashing over either.
}
