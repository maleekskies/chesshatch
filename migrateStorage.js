// Migration covering both renames this app has been through:
// "chesspath_*" (original name) and "chessloop_*" (first rename) both
// get moved to "chesshatch_*" (current name). Checks both possible old
// prefixes for each key, since a tester could be on either version,
// copies whichever value exists across (without overwriting an
// existing new-key value, in case this runs twice), and removes the
// old key, so nobody's streak, badges, or preferences reset just
// because the app got renamed again.
//
// This module has no exports. Importing it is for its side effect,
// and it must be imported before anything else reads these keys, see
// the top of main.jsx.
const KEY_NAMES = [
  "last_visit",
  "streak",
  "walkthrough_dismissed",
  "feedback_mode",
  "badges",
];
const OLD_PREFIXES = ["chesspath_", "chessloop_"];
const NEW_PREFIX = "chesshatch_";

try {
  for (const name of KEY_NAMES) {
    const newKey = NEW_PREFIX + name;
    if (localStorage.getItem(newKey) !== null) continue;
    for (const prefix of OLD_PREFIXES) {
      const oldKey = prefix + name;
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        localStorage.setItem(newKey, oldValue);
        localStorage.removeItem(oldKey);
        break;
      }
    }
  }
} catch {
  // localStorage unavailable (private browsing, disabled, etc.), no
  // migration possible, but nothing worth crashing over either.
}

