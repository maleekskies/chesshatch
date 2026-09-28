import { useState, useEffect } from "react";
import { Trophy, BookOpen, Target, Zap, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";
import { TIME_CONTROLS } from "../lib/glicko2.js";
import { BADGES } from "../lib/badges.js";

// A real profile page, aggregates data already being collected
// (ratings, lessons completed, diagnostic tier, puzzle rush best) into
// one view for the tester themselves, rather than only existing in the
// Admin dashboard for you to see.
export default function Profile({ session, textMain, textMuted, panelBg, borderCol, accentGold, isPhone }) {
  const [ratings, setRatings] = useState([]);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [latestTier, setLatestTier] = useState(null);
  const [rushBest, setRushBest] = useState(0);
  const [earnedBadgeKeys, setEarnedBadgeKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const [{ data: r }, { data: prog }, { data: diag }, { data: rush }, { data: badges }] = await Promise.all([
        supabase.from("ratings").select("*").eq("user_id", session.user.id),
        supabase.from("progress").select("node_key").eq("user_id", session.user.id).eq("status", "mastered"),
        supabase.from("diagnostic_results").select("tier").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("puzzle_rush_scores").select("best_streak").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("badges_earned").select("badge_key").eq("user_id", session.user.id),
      ]);
      setRatings(r || []);
      setLessonsCompleted(prog?.length || 0);
      setLatestTier(diag?.[0]?.tier || null);
      setRushBest(rush?.best_streak || 0);
      setEarnedBadgeKeys(new Set((badges || []).map((b) => b.badge_key)));
      setLoading(false);
    })();
  }, [session]);

  if (!session?.user) {
    return <p style={{ color: textMuted, fontSize: 13.5 }}>Sign in to see your profile.</p>;
  }
  if (loading) {
    return <p style={{ color: textMuted, fontSize: 13.5 }}>Loading…</p>;
  }

  const ratingByTC = Object.fromEntries(ratings.map((r) => [r.time_control, r]));

  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: isPhone ? 22 : 26, fontWeight: 700, margin: "0 0 4px" }}>
        {session.user.email}
      </h2>
      <p style={{ color: textMuted, fontSize: 12.5, marginBottom: 24, fontFamily: "'IBM Plex Mono', monospace" }}>
        Member since {new Date(session.user.created_at).toLocaleDateString()}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Trophy size={15} color={accentGold} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: textMain }}>Ratings</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 26 }}>
        {TIME_CONTROLS.map((tc) => {
          const r = ratingByTC[tc.key];
          return (
            <div key={tc.key} style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: r ? textMain : textMuted }}>
                {r ? r.rating : ", "}
              </div>
              <div style={{ fontSize: 10.5, color: textMuted, marginTop: 2 }}>{tc.label}</div>
              {r && <div style={{ fontSize: 9.5, color: textMuted, marginTop: 3 }}>{r.games_played} games</div>}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
        <StatBlock icon={<BookOpen size={16} color={accentGold} />} label="Lessons mastered" value={lessonsCompleted} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} />
        <StatBlock icon={<Target size={16} color={accentGold} />} label="Diagnostic tier" value={latestTier || "Not taken yet"} small textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} />
        <StatBlock icon={<Zap size={16} color={accentGold} />} label="Best Puzzle Rush streak" value={rushBest} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "26px 0 12px" }}>
        <Sparkles size={15} color={accentGold} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: textMain }}>Badges</span>
        <span style={{ fontSize: 11, color: textMuted }}>({earnedBadgeKeys.size} of {Object.keys(BADGES).length})</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        {Object.entries(BADGES).map(([key, badge]) => {
          const earned = earnedBadgeKeys.has(key);
          return (
            <div key={key} title={badge.desc} style={{
              background: panelBg, border: `1px solid ${earned ? accentGold : borderCol}`, borderRadius: 9,
              padding: "12px 10px", textAlign: "center", opacity: earned ? 1 : 0.45,
            }}>
              <div style={{ fontSize: 22, marginBottom: 4, filter: earned ? "none" : "grayscale(1)" }}>{badge.icon}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: earned ? textMain : textMuted }}>{badge.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value, small, textMain, textMuted, panelBg, borderCol }) {
  return (
    <div style={{ background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 10, padding: 16 }}>
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: small ? 15 : 22, fontWeight: 700, color: textMain, fontFamily: small ? "'Inter', sans-serif" : "'Poppins', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: textMuted, marginTop: 3 }}>{label}</div>
    </div>
  );
}
