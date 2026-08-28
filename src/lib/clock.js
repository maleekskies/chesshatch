// Chess clock logic, countdown timers with increment, matching
// standard time-control behavior (Fischer increment: added AFTER the
// move that used it, not before).
//
// HONEST FLAG for Live Match specifically: in a two-client Realtime
// game, each browser runs its own local countdown. Clocks are
// resynced whenever a move arrives (both sides snap to the mover's
// reported remaining time), which keeps drift from compounding, but
// there's no server-authoritative clock, a player with a badly lagging
// connection could theoretically see a slightly different time than
// their opponent for a moment. This is the standard approach for a
// client-only real-time app without a dedicated game server, but it's
// worth knowing this isn't the same guarantee a server-timed clock (like
// Lichess's own backend-authoritative clocks) provides.

export function msFromMinutes(minutes) {
  return minutes * 60 * 1000;
}

export function formatClock(ms) {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) {
    // show tenths under 10 seconds, like Lichess does for low time
    const tenths = Math.floor((ms % 1000) / 100);
    return totalSeconds < 10 ? `0:0${s}.${tenths}` : `0:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function isLowTime(ms) {
  return ms > 0 && ms < 10000; // under 10 seconds. Lichess-style red flash threshold
}
