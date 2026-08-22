import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.js";

// A real look at how the beta is going — not the tester-facing progress
// dashboard from the blueprint, but YOUR view: how many testers, what
// tiers they're landing in, where progress drops off, and raw feedback.
// Gated to a known admin email so testers don't stumble into it.
const ADMIN_EMAIL = "maleekade775@gmail.com";

export default function Admin({ session, textMain, textMuted, panelBg, borderCol, accentGold, isPhone }) {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: profiles }, { data: results }, { data: progress }, { data: fb }] = await Promise.all([
        supabase.from("profiles").select("id"),
        supabase.from("diagnostic_results").select("tier"),
        supabase.from("progress").select("node_key, status"),
        supabase.from("feedback").select("message, page, created_at").order("created_at", { ascending: false }).limit(30),
      ]);

      const tierCounts = {};
      (results || []).forEach((r) => { tierCounts[r.tier] = (tierCounts[r.tier] || 0) + 1; });

      const lessonCounts = {};
      (progress || []).forEach((p) => {
        if (p.status === "mastered") lessonCounts[p.node_key] = (lessonCounts[p.node_key] || 0) + 1;
      });

      setStats({
        testerCount: profiles?.length || 0,
        diagnosticCount: results?.length || 0,
        tierCounts,
        lessonCounts,
      });
      setFeedback(fb || []);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!session?.user) {
    return <p style={{ color: textMuted, fontSize: 13.5 }}>Sign in to view this page.</p>;
  }
  if (!isAdmin) {
    return <p style={{ color: textMuted, fontSize: 13.5 }}>This page isn't available for your account.</p>;
  }
  if (loading) {
    return <p style={{ color: textMuted, fontSize: 13.5 }}>Loading beta stats…</p>;
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: isPhone ? 22 : 26, fontWeight: 700, margin: "0 0 20px" }}>
        Beta overview
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 26 }}>
        <StatCard label="Signed-in testers" value={stats.testerCount} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} />
        <StatCard label="Diagnostics taken" value={stats.diagnosticCount} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} />
        <StatCard label="Lesson completions" value={Object.values(stats.lessonCounts).reduce((a, b) => a + b, 0)} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} />
        <StatCard label="Feedback items" value={feedback.length} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} />
      </div>

      <SectionHeading title="Diagnostic tier distribution" accentGold={accentGold} />
      <div style={{ marginBottom: 24 }}>
        {Object.keys(stats.tierCounts).length === 0 && <p style={{ color: textMuted, fontSize: 13 }}>No diagnostics taken yet.</p>}
        {Object.entries(stats.tierCounts).map(([tier, count]) => (
          <div key={tier} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${borderCol}`, fontSize: 13, color: textMain }}>
            <span>{tier}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", color: textMuted }}>{count}</span>
          </div>
        ))}
      </div>

      <SectionHeading title="Lesson completion — where people drop off" accentGold={accentGold} />
      <div style={{ marginBottom: 24 }}>
        {Object.keys(stats.lessonCounts).length === 0 && <p style={{ color: textMuted, fontSize: 13 }}>No lessons completed yet.</p>}
        {Object.entries(stats.lessonCounts).map(([lesson, count]) => (
          <div key={lesson} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${borderCol}`, fontSize: 13, color: textMain }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{lesson}</span><span style={{ color: textMuted }}>{count}</span>
          </div>
        ))}
      </div>

      <SectionHeading title="Recent feedback" accentGold={accentGold} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {feedback.length === 0 && <p style={{ color: textMuted, fontSize: 13 }}>No feedback submitted yet.</p>}
        {feedback.map((f, i) => (
          <div key={i} style={{ padding: "10px 12px", background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 8 }}>
            <div style={{ fontSize: 10.5, color: textMuted, marginBottom: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
              {f.page || "unknown page"} · {new Date(f.created_at).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: textMain }}>{f.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, textMain, textMuted, panelBg, borderCol }) {
  return (
    <div style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: "12px 14px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: textMain, fontFamily: "'Fraunces', serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}
function SectionHeading({ title, accentGold }) {
  return <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: accentGold, marginBottom: 10 }}>{title}</div>;
}
