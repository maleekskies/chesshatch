// Feedback for when a move lands on the board: a short sound, a short
// vibration on supported devices, or nothing at all, depending on the
// person's chosen mode. Same per-browser localStorage pattern as the
// board theme picker elsewhere in the app.
//
// HONEST NOTE: there's no real recorded chess-set sound file available
// in this offline environment (no internet access to source one), so
// this is a short tone synthesized with the Web Audio API, shaped with
// a fast attack and quick decay to approximate a wooden piece landing
// on a board. It is not a sampled recording of a real chess set.

const STORAGE_KEY = "chessloop_feedback_mode";
const VALID_MODES = ["sound", "vibration", "silent"];

export function getFeedbackMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_MODES.includes(stored) ? stored : "sound";
  } catch {
    return "sound";
  }
}

export function setFeedbackMode(mode) {
  if (!VALID_MODES.includes(mode)) return;
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* localStorage unavailable */ }
}

let sharedAudioCtx = null;
function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx) {
    try { sharedAudioCtx = new Ctor(); } catch { return null; }
  }
  return sharedAudioCtx;
}

function playSynthesizedClick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.05);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

function triggerVibration() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(30);
  }
  // Vibration isn't supported on iOS Safari at all (a platform
  // limitation, not something a web app can work around) so this is a
  // silent no-op there, same as the "silent" mode.
}

// Call this once, right after any move actually lands on the board,
// whether it was the local player's own move, the computer's reply,
// an opponent's move arriving over Live Match, or a guided-game
// scripted move.
export function giveMoveFeedback() {
  const mode = getFeedbackMode();
  if (mode === "sound") playSynthesizedClick();
  else if (mode === "vibration") triggerVibration();
}
