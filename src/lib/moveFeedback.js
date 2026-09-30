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

// Checkmate gets its own cue: a short, warm three-note chord that decays
// away, rather than the dry click a normal move makes. Same synthesized
// approach as the move sound above, and the same honest limitation: this is
// a shaped tone, not a sampled recording of a chess set.
function playSynthesizedCheckmate() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
  master.connect(ctx.destination);

  // C5, E5, G5, then a low C4 underneath: a settled, "finished" sound
  // instead of a fanfare, which would be too much for a board this quiet.
  const notes = [
    { freq: 523.25, delay: 0, dur: 0.85, type: "triangle" },
    { freq: 659.25, delay: 0.05, dur: 0.8, type: "triangle" },
    { freq: 783.99, delay: 0.1, dur: 0.75, type: "triangle" },
    { freq: 261.63, delay: 0.02, dur: 1.0, type: "sine" },
  ];
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + note.delay;
    osc.type = note.type;
    osc.frequency.setValueAtTime(note.freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.type === "sine" ? 0.5 : 0.8, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + note.dur + 0.02);
  }
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

// Call this once, at the moment the game ends in checkmate. Respects the
// same feedback preference: silent stays silent, vibration gets a longer
// buzz where the platform supports it.
export function giveCheckmateFeedback() {
  const mode = getFeedbackMode();
  if (mode === "sound") playSynthesizedCheckmate();
  else if (mode === "vibration" && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate([40, 60, 90]);
  }
}
