import { useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";

// Floating feedback button, present on every screen. Deliberately low
// friction for a small beta group: no category picker, no required
// fields beyond the message itself, just "something's confusing here"
// captured with which screen they were on.
export default function FeedbackButton({ session, currentScreen, textMain, textMuted, panelBg, borderCol, accentGold }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  async function submit() {
    if (!message.trim()) return;
    setStatus("sending");
    const { error } = await supabase.from("feedback").insert({
      user_id: session?.user?.id || null,
      message: message.trim(),
      page: currentScreen,
    });
    if (error) { setStatus("error"); return; }
    setStatus("sent");
    setMessage("");
    setTimeout(() => { setOpen(false); setStatus(null); }, 1400);
  }

  return (
    <div style={{ position: "fixed", bottom: "calc(20px + env(safe-area-inset-bottom))", right: "calc(20px + env(safe-area-inset-right))", zIndex: 40 }}>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 10px)", right: 0, width: 260, background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: 14, boxShadow: "0 12px 28px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: textMain }}>Something confusing?</span>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "transparent", border: "none", color: textMuted, cursor: "pointer", padding: 10, margin: -10, display: "flex", alignItems: "center" }}>
              <X size={14} />
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's unclear or broken, we're actively testing this."
            rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: `1px solid ${borderCol}`, background: "transparent", color: textMain, fontSize: 12.5, resize: "vertical", marginBottom: 8, fontFamily: "inherit" }}
          />
          <button onClick={submit} disabled={status === "sending" || !message.trim()}
            style={{ width: "100%", background: accentGold, color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 10px", fontSize: 12.5, fontWeight: 600, cursor: message.trim() ? "pointer" : "not-allowed" }}>
            {status === "sending" ? "Sending…" : status === "sent" ? "Thanks, sent." : "Send"}
          </button>
          {status === "error" && <div style={{ fontSize: 11, color: "#E05B5B", marginTop: 6 }}>Something went wrong, try again.</div>}
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)}
        style={{ width: 44, height: 44, borderRadius: "50%", background: accentGold, border: "none", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,0,0,0.3)" }}>
        <MessageSquarePlus size={19} />
      </button>
    </div>
  );
}
