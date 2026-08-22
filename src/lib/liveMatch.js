// Live matchmaking via Supabase Realtime (broadcast + presence).
//
// HONEST FLAG: this is the least-verified piece of this build. Broadcast
// and presence are documented, standard supabase-js v2 APIs, but actual
// two-client sync behavior can only really be confirmed by opening two
// browser windows and testing it live — which isn't possible from this
// sandbox. Test this one specifically, with two real tabs/devices,
// before relying on it with testers.
import { supabase } from "./supabaseClient.js";

export function generateMatchCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function joinMatchChannel(code, { onMove, onOpponentJoined, onPresenceSync }) {
  const channel = supabase.channel(`match-${code}`, {
    config: { broadcast: { self: false }, presence: { key: code } },
  });

  channel
    .on("broadcast", { event: "move" }, ({ payload }) => onMove?.(payload))
    .on("broadcast", { event: "opponent-joined" }, ({ payload }) => onOpponentJoined?.(payload))
    .on("presence", { event: "sync" }, () => onPresenceSync?.(channel.presenceState()))
    .subscribe();

  return channel;
}

export function sendMove(channel, { from, to, promotion }) {
  channel.send({ type: "broadcast", event: "move", payload: { from, to, promotion } });
}

export function announceJoin(channel, role) {
  channel.send({ type: "broadcast", event: "opponent-joined", payload: { role } });
}
