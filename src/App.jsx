import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "./lib/supabaseClient.js";
import Play from "./screens/Play.jsx";
import Lessons, { PuzzleView } from "./screens/Lessons.jsx";
import LiveMatch from "./screens/LiveMatch.jsx";
import PuzzleRush from "./screens/PuzzleRush.jsx";
import Profile from "./screens/Profile.jsx";
import Admin from "./screens/Admin.jsx";
import Privacy from "./screens/Privacy.jsx";
import GuidedGame from "./screens/GuidedGame.jsx";
import BeginnerMistakes from "./screens/BeginnerMistakes.jsx";
import Glossary from "./screens/Glossary.jsx";
import { BADGES, awardBadge } from "./lib/badges.js";
import FeedbackButton from "./components/FeedbackButton.jsx";
import { SAMPLE_PUZZLES, TIER1_LESSONS } from "./data/lessons.js";
import {
  Menu, X, ChevronRight, Target, BookOpen, TrendingUp, Sparkles, Crown
} from "lucide-react";

function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
}

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    function onResize() { setW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

// Simple day-streak counter, stored in localStorage. Honest limitation:
// this is per-browser, not per-account — it resets if the person clears
// their browser data or switches devices. A cross-device version would
// need to read/write this from Supabase per user instead; this is the
// lightweight v1.
function useStreak() {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("chesspath_last_visit");
    const prevStreak = parseInt(localStorage.getItem("chesspath_streak") || "0", 10);
    if (last === today) {
      setStreak(prevStreak);
      return;
    }
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = last === yesterday ? prevStreak + 1 : 1;
    localStorage.setItem("chesspath_last_visit", today);
    localStorage.setItem("chesspath_streak", String(newStreak));
    setStreak(newStreak);
  }, []);
  return streak;
}

// Deterministic "puzzle of the day" — same puzzle for everyone on a
// given calendar day, picked from the sample set by date rather than
// randomly, so it's actually the same daily puzzle across visits.
function dailyPuzzle() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return SAMPLE_PUZZLES[dayIndex % SAMPLE_PUZZLES.length];
}

// ================= Board themes (used by Play + Lessons boards) =================
const THEMES = {
  brown: { name: "Brown", light: "#F0D9B5", dark: "#B58863", accent: "#C9A227" },
  blue: { name: "Blue", light: "#DEE3E6", dark: "#8CA2AD", accent: "#F2A65A" },
  green: { name: "Green", light: "#EEEED2", dark: "#769656", accent: "#D97706" },
  highContrast: { name: "Colorblind-safe", light: "#F0E9DA", dark: "#2B6CB0", accent: "#DD6B20" },
};
// Brown and Blue match Lichess's actual published values; Green matches
// the widely-used standard chess-board green palette; the accent UI
// color (used for highlights/buttons, not the board itself) is
// ChessPath's own, not Lichess's.

// ================= Diagnostic quiz content =================
const QUIZ = [
  { id:"q1", cat:"rules", prompt:"Which piece can jump over other pieces?", options:["Bishop","Knight","Rook","Queen"], answer:1 },
  { id:"q2", cat:"rules", prompt:"What's it called when the king is under attack but not checkmated?", options:["Stalemate","Fork","Check","Castle"], answer:2 },
  { id:"q3", cat:"tactics", prompt:"A single move that attacks two enemy pieces at once is called a:", options:["Pin","Fork","Skewer","Discovered attack"], answer:1 },
  { id:"q4", cat:"tactics", prompt:"Attacking a valuable piece that's hiding a less valuable one behind it, on the same line, is a:", options:["Skewer","Fork","Zwischenzug","Deflection"], answer:0 },
  { id:"q5", cat:"endgame", prompt:"In a king-and-pawn endgame, fighting for the square directly ahead of your pawn with your king is called:", options:["Zugzwang","Opposition","Triangulation","Promotion"], answer:1 },
  { id:"q6", cat:"positional", prompt:"Placing a piece where it can't be safely attacked, deep in enemy territory, is an example of good:", options:["Piece activity","Pawn structure","Prophylaxis","Weak squares"], answer:0 },
];
const CATS = ["rules","tactics","endgame","positional"];
const CAT_LABEL = { rules:"Rules", tactics:"Tactics", endgame:"Endgames", positional:"Positional" };

// ================= First-visit nav walkthrough =================
// A short, dismissible tour that points at the three nav items a brand
// new visitor most needs to notice. Shown once per browser (localStorage
// flag) — same per-browser, not per-account, limitation as the streak
// counter above.
const WALKTHROUGH_DISMISSED_KEY = "chesspath_walkthrough_dismissed";
const WALKTHROUGH_STEPS = [
  { key:"diagnostic", label:"Diagnostic", text:"Not sure where to start? A short quiz places you at the right level." },
  { key:"lessons", label:"Lessons", text:"Step-by-step lessons, from how pieces move up to real tactics — with a live coach watching your moves." },
  { key:"play", label:"Play", text:"Play freely against a friend on the same device, or against the built-in computer at any difficulty." },
];

function scoreQuiz(answers){
  const perCat = {}; CATS.forEach(c=>perCat[c]={correct:0,total:0});
  let correct=0;
  QUIZ.forEach(q=>{
    perCat[q.cat].total += 1;
    if(answers[q.id]===q.answer){ correct+=1; perCat[q.cat].correct+=1; }
  });
  const pct = correct/QUIZ.length;
  let tier = "Complete Beginner";
  if(pct>0.8) tier="Advanced";
  else if(pct>0.5) tier="Intermediate";
  else if(pct>0.25) tier="Casual Improver";
  return { correct, total:QUIZ.length, pct, perCat, tier };
}


// ================= App shell =================
export default function ChessPathApp(){
  useFonts();
  const width = useWindowWidth();
  const streak = useStreak();
  const isPhone = width < 560;

  const [screen, setScreen] = useState("landing"); // landing | diagnostic | results | lessons | play
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [navOpen, setNavOpen] = useState(false);
  const [darkMode] = useState(true);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [dailyPuzzleOpen, setDailyPuzzleOpen] = useState(false);
  const [boardThemeKey, setBoardThemeKey] = useState("brown");

  // ---- Badges ----
  const [badgeToast, setBadgeToast] = useState(null); // badge key currently celebrating, or null

  function celebrateBadge(key) {
    const newKey = awardBadge(key, session);
    if (newKey) setBadgeToast(newKey);
  }

  useEffect(() => {
    if (!badgeToast) return;
    const t = setTimeout(() => setBadgeToast(null), 4200);
    return () => clearTimeout(t);
  }, [badgeToast]);

  // Streak milestones piggyback on the existing streak counter above.
  useEffect(() => {
    if (streak === 3) celebrateBadge("streak_3");
    else if (streak === 7) celebrateBadge("streak_7");
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps


  // ---- First-visit nav walkthrough ----
  const [walkthroughStep, setWalkthroughStep] = useState(null); // null = inactive, else index into WALKTHROUGH_STEPS
  const [walkthroughRect, setWalkthroughRect] = useState(null);
  const walkthroughRefs = useRef({});

  function registerWalkthroughRef(key) {
    return (el) => { walkthroughRefs.current[key] = el; };
  }

  // Kick off the tour once, on first mount, if this browser hasn't
  // dismissed it before. Read window.innerWidth directly (rather than
  // the isPhone flag) so a resize during the short delay below can't
  // leave it acting on a stale mobile/desktop guess.
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(WALKTHROUGH_DISMISSED_KEY) === "1"; } catch { /* localStorage unavailable */ }
    if (dismissed) return;
    const t = setTimeout(() => {
      setWalkthroughStep(0);
      if (window.innerWidth < 560) setNavOpen(true);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  // Recompute the highlighted rectangle whenever the active step, the
  // mobile menu open/closed state, or the viewport width changes — and
  // keep it in sync with resize/scroll while a step is showing. If the
  // target nav item isn't currently in the DOM (e.g. the visitor closed
  // the mobile menu manually), the rect resolves to null and the
  // tooltip simply doesn't render rather than pointing at nothing.
  useEffect(() => {
    if (walkthroughStep === null) { setWalkthroughRect(null); return; }
    function measure() {
      const key = WALKTHROUGH_STEPS[walkthroughStep]?.key;
      const el = key ? walkthroughRefs.current[key] : null;
      setWalkthroughRect(el ? el.getBoundingClientRect() : null);
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [walkthroughStep, navOpen, width]);

  function dismissWalkthrough() {
    setWalkthroughStep(null);
    try { localStorage.setItem(WALKTHROUGH_DISMISSED_KEY, "1"); } catch { /* localStorage unavailable */ }
  }

  function advanceWalkthrough() {
    if (walkthroughStep === null) return;
    if (walkthroughStep + 1 >= WALKTHROUGH_STEPS.length) dismissWalkthrough();
    else setWalkthroughStep(walkthroughStep + 1);
  }

  // ---- Supabase auth (magic link) ----
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin"); // 'signin' | 'signup'
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [savedThisResult, setSavedThisResult] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await supabase.from("profiles").upsert({
          id: newSession.user.id,
          display_name: newSession.user.email,
        });
        // Load previously-completed lesson nodes for this user
        const { data: rows } = await supabase
          .from("progress")
          .select("node_key")
          .eq("user_id", newSession.user.id)
          .eq("status", "mastered");
        if (rows) setCompletedIds(new Set(rows.map((r) => r.node_key)));
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submitAuth() {
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthError(null);
    const { error } =
      authMode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthOpen(false);
    setPassword("");
  }
  async function signOut() {
    await supabase.auth.signOut();
    setAuthOpen(false);
  }

  async function markLessonComplete(lessonId) {
    const next = new Set(completedIds).add(lessonId);
    setCompletedIds(next);
    celebrateBadge("first_lesson");
    if (TIER1_LESSONS.every((l) => next.has(l.id))) celebrateBadge("tier1_complete");
    if (session?.user) {
      await supabase.from("progress").upsert(
        { user_id: session.user.id, node_key: lessonId, status: "mastered" },
        { onConflict: "user_id,node_key" }
      );
    }
  }

  const pageBg = darkMode ? "#1B2430" : "#F5F1E8";
  const panelBg = darkMode ? "#232E3D" : "#FFFFFF";
  const textMain = darkMode ? "#EDE6D6" : "#1B2430";
  const textMuted = darkMode ? "#8791A1" : "#6B7280";
  const borderCol = darkMode ? "#2E3A4C" : "#E5E0D3";
  const accentGold = "#C9A227";

  const result = useMemo(()=> scoreQuiz(answers), [answers]);

  useEffect(() => {
    if (screen === "results" && session?.user && !savedThisResult) {
      supabase.from("diagnostic_results").insert({
        user_id: session.user.id,
        tier: result.tier,
        score_tactics: result.perCat.tactics.correct,
        score_endgames: result.perCat.endgame.correct,
        score_positional: result.perCat.positional.correct,
        score_rules: result.perCat.rules.correct,
        raw_answers: answers,
      }).then(({ error }) => { if (!error) setSavedThisResult(true); });
    }
  }, [screen, session, result, answers, savedThisResult]);

  function selectAnswer(qid, idx){
    setAnswers(a=>({...a,[qid]:idx}));
    setTimeout(()=>{
      if(qIndex < QUIZ.length-1) setQIndex(i=>i+1);
      else setScreen("results");
    }, 250);
  }

  function startQuiz(){ setAnswers({}); setQIndex(0); setScreen("diagnostic"); setSavedThisResult(false); }

  return (
    <div style={{ minHeight:"100%", background:pageBg, color:textMain, fontFamily:"'Inter', system-ui, sans-serif", overflowX:"hidden" }}>
      {/* Nav */}
      <div role="navigation" aria-label="Main navigation" style={{ borderBottom:`1px solid ${borderCol}`, position:"sticky", top:0, background:pageBg, zIndex:10 }}>
        <div style={{ maxWidth:1080, margin:"0 auto", padding: isPhone ? "12px 16px" : "14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div onClick={()=>setScreen("landing")} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:6, background:accentGold, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Crown size={16} color="#1B2430"/>
            </div>
            <span style={{ fontFamily:"'Fraunces', serif", fontWeight:600, fontSize:17 }}>ChessPath</span>
          </div>

          {isPhone ? (
            <button onClick={()=>setNavOpen(v=>!v)} style={{ background:"transparent", border:"none", color:textMain, cursor:"pointer" }}>
              {navOpen ? <X size={22}/> : <Menu size={22}/>}
            </button>
          ) : (
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <NavBtn active={screen==="landing"} onClick={()=>setScreen("landing")} textMain={textMain} accentGold={accentGold}>Home</NavBtn>
              <div ref={registerWalkthroughRef("diagnostic")} style={{ display:"inline-flex" }}>
                <NavBtn active={screen==="diagnostic"||screen==="results"} onClick={startQuiz} textMain={textMain} accentGold={accentGold}>Diagnostic</NavBtn>
              </div>
              <div ref={registerWalkthroughRef("lessons")} style={{ display:"inline-flex" }}>
                <NavBtn active={screen==="lessons"||screen==="lessons-zk"} onClick={()=>setScreen("lessons")} textMain={textMain} accentGold={accentGold}>Lessons</NavBtn>
              </div>
              <div ref={registerWalkthroughRef("play")} style={{ display:"inline-flex" }}>
                <NavBtn active={screen==="play"} onClick={()=>setScreen("play")} textMain={textMain} accentGold={accentGold}>Play</NavBtn>
              </div>
              {completedIds.size > 0 && (
                <>
                  <NavBtn active={screen==="live"} onClick={()=>setScreen("live")} textMain={textMain} accentGold={accentGold}>Live</NavBtn>
                  <NavBtn active={screen==="rush"} onClick={()=>setScreen("rush")} textMain={textMain} accentGold={accentGold}>Rush</NavBtn>
                  {session?.user && <NavBtn active={screen==="profile"} onClick={()=>setScreen("profile")} textMain={textMain} accentGold={accentGold}>Profile</NavBtn>}
                </>
              )}
              <BoardThemePicker boardThemeKey={boardThemeKey} setBoardThemeKey={setBoardThemeKey} textMuted={textMuted} borderCol={borderCol} panelBg={panelBg} accentGold={accentGold} />
              {session?.user?.email === "maleekade775@gmail.com" && (
                <NavBtn active={screen==="admin"} onClick={()=>setScreen("admin")} textMain={textMain} accentGold={accentGold}>Admin</NavBtn>
              )}
              <AuthControl session={session} authOpen={authOpen} setAuthOpen={setAuthOpen} email={email} setEmail={setEmail}
                password={password} setPassword={setPassword} authMode={authMode} setAuthMode={setAuthMode}
                authError={authError} authLoading={authLoading} submitAuth={submitAuth} signOut={signOut}
                textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} panelBg={panelBg}/>
            </div>
          )}
        </div>
        {isPhone && navOpen && (
          <div style={{ padding:"0 16px 14px", display:"flex", flexDirection:"column", gap:6 }}>
            <NavBtn full active={screen==="landing"} onClick={()=>{setScreen("landing"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Home</NavBtn>
            <div ref={registerWalkthroughRef("diagnostic")}>
              <NavBtn full active={screen==="diagnostic"||screen==="results"} onClick={()=>{startQuiz(); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Diagnostic</NavBtn>
            </div>
            <div ref={registerWalkthroughRef("lessons")}>
              <NavBtn full active={screen==="lessons"||screen==="lessons-zk"} onClick={()=>{setScreen("lessons"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Lessons</NavBtn>
            </div>
            <div ref={registerWalkthroughRef("play")}>
              <NavBtn full active={screen==="play"} onClick={()=>{setScreen("play"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Play</NavBtn>
            </div>
            {completedIds.size > 0 && (
              <>
                <NavBtn full active={screen==="live"} onClick={()=>{setScreen("live"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Live</NavBtn>
                <NavBtn full active={screen==="rush"} onClick={()=>{setScreen("rush"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Rush</NavBtn>
                {session?.user && <NavBtn full active={screen==="profile"} onClick={()=>{setScreen("profile"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Profile</NavBtn>}
              </>
            )}
            <div style={{ padding:"6px 12px" }}>
              <BoardThemePicker boardThemeKey={boardThemeKey} setBoardThemeKey={setBoardThemeKey} textMuted={textMuted} borderCol={borderCol} panelBg={panelBg} accentGold={accentGold} />
            </div>
            <div style={{ marginTop:6 }}>
              <AuthControl session={session} authOpen={authOpen} setAuthOpen={setAuthOpen} email={email} setEmail={setEmail}
                password={password} setPassword={setPassword} authMode={authMode} setAuthMode={setAuthMode}
                authError={authError} authLoading={authLoading} submitAuth={submitAuth} signOut={signOut}
                textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} panelBg={panelBg} full/>
            </div>
          </div>
        )}
      </div>

      {walkthroughStep !== null && walkthroughRect && (
        <WalkthroughTooltip
          rect={walkthroughRect}
          step={WALKTHROUGH_STEPS[walkthroughStep]}
          stepNumber={walkthroughStep + 1}
          totalSteps={WALKTHROUGH_STEPS.length}
          isLast={walkthroughStep === WALKTHROUGH_STEPS.length - 1}
          onNext={advanceWalkthrough}
          onSkip={dismissWalkthrough}
          isPhone={isPhone}
          textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold}
        />
      )}

      {badgeToast && BADGES[badgeToast] && (
        <BadgeToast badge={BADGES[badgeToast]} onDismiss={() => setBadgeToast(null)} isPhone={isPhone}
          textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} />
      )}

      <div style={{ maxWidth:1200, margin:"0 auto", padding: isPhone ? "24px 16px 48px" : "40px 24px 64px" }}>

        {screen==="landing" && dailyPuzzleOpen && (
          <div style={{ maxWidth: 700 }}>
            <button onClick={()=>setDailyPuzzleOpen(false)} style={{ background:"transparent", border:"none", color:textMuted, fontSize:12.5, cursor:"pointer", marginBottom:14, padding:0 }}>
              ← Back
            </button>
            <div style={{ fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:accentGold, marginBottom:10 }}>Today's Puzzle</div>
            <PuzzleView puzzle={dailyPuzzle()} theme={THEMES[boardThemeKey]} textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} isPhone={isPhone} session={session} onBack={()=>setDailyPuzzleOpen(false)} onEarnBadge={celebrateBadge} />
          </div>
        )}

        {screen==="landing" && !dailyPuzzleOpen && (
          <div>
            <div style={{ fontFamily:"'Fraunces', serif", fontSize:12, letterSpacing:"0.18em", textTransform:"uppercase", color:accentGold, marginBottom:10 }}>
              Learn. Play. Master.
            </div>
            <h1 style={{ fontFamily:"'Fraunces', serif", fontWeight:700, fontSize: isPhone?30:44, lineHeight:1.1, margin:0, maxWidth:640 }}>
              A chess curriculum, not a pile of puzzles.
            </h1>
            <p style={{ color:textMuted, fontSize: isPhone?14:16, lineHeight:1.6, marginTop:16, maxWidth:560 }}>
              ChessPath figures out what you actually know, then teaches what's next — from
              "how does a knight move" all the way to tournament-level repertoire prep.
            </p>
            <div style={{ display:"flex", gap:12, marginTop:26, flexWrap:"wrap" }}>
              <button onClick={startQuiz} style={{ background:accentGold, color:"#1B2430", border:"none", borderRadius:8, padding: isPhone ? "12px 18px" : "13px 22px", fontSize:14.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                Take the diagnostic <ChevronRight size={16}/>
              </button>
              <button onClick={()=>setScreen("lessons")} style={{ background:"transparent", color:textMain, border:`1px solid ${borderCol}`, borderRadius:8, padding: isPhone ? "12px 18px" : "13px 22px", fontSize:14.5, fontWeight:600, cursor:"pointer" }}>
                Start Tier 1 lessons
              </button>
              <button onClick={()=>{ setDailyPuzzleOpen(true); setScreen("landing"); }} style={{ background:"transparent", color:accentGold, border:`1px solid ${accentGold}`, borderRadius:8, padding: isPhone ? "12px 18px" : "13px 22px", fontSize:14.5, fontWeight:600, cursor:"pointer" }}>
                Today's puzzle
              </button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:14 }}>
              <button onClick={()=>setScreen("lessons-zk")} style={{ background:"transparent", border:"none", color:textMuted, fontSize:13, padding:0, cursor:"pointer", display:"flex", alignItems:"center", gap:5, textDecoration:"underline", textUnderlineOffset:3, width:"fit-content" }}>
                Never played before? Skip straight to Lesson 1 <ChevronRight size={13}/>
              </button>
              <button onClick={()=>setScreen("guided")} style={{ background:"transparent", border:"none", color:textMuted, fontSize:13, padding:0, cursor:"pointer", display:"flex", alignItems:"center", gap:5, textDecoration:"underline", textUnderlineOffset:3, width:"fit-content" }}>
                Or play a short guided first game, move by move <ChevronRight size={13}/>
              </button>
            </div>

            {streak > 1 && (
              <div style={{ marginTop:16, display:"inline-flex", alignItems:"center", gap:6, background:panelBg, border:`1px solid ${borderCol}`, borderRadius:20, padding:"6px 12px", fontSize:12.5, color:textMuted }}>
                🔥 <span style={{ color:textMain, fontWeight:600 }}>{streak}-day streak</span>
              </div>
            )}

            <div style={{ marginTop: isPhone?36:52, display:"grid", gridTemplateColumns: isPhone ? "1fr" : "repeat(3, 1fr)", gap:14 }}>
              {[
                { icon:<Target size={18} color={accentGold}/>, title:"Diagnostic placement", desc:"A short adaptive test finds your real level across tactics, endgames, and rules." },
                { icon:<BookOpen size={18} color={accentGold}/>, title:"Real lessons, not just play", desc:"Tier 1 teaches piece movement, mate patterns, and tactics one step at a time — with a live coach watching your moves." },
                { icon:<TrendingUp size={18} color={accentGold}/>, title:"Lesson-to-play loop", desc:"Every lesson ends in a matched puzzle set that locks it in." },
              ].map((f,i)=>(
                <div key={i} style={{ background:panelBg, border:`1px solid ${borderCol}`, borderRadius:10, padding:16 }}>
                  <div style={{ marginBottom:10 }}>{f.icon}</div>
                  <div style={{ fontWeight:600, fontSize:14.5, marginBottom:6 }}>{f.title}</div>
                  <div style={{ color:textMuted, fontSize:13, lineHeight:1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen==="diagnostic" && (
          <div style={{ maxWidth:560, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <span style={{ fontSize:12, color:textMuted, fontFamily:"'IBM Plex Mono', monospace" }}>
                Question {qIndex+1} of {QUIZ.length}
              </span>
              <span style={{ fontSize:11, color:accentGold, fontFamily:"'IBM Plex Mono', monospace", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                {CAT_LABEL[QUIZ[qIndex].cat]}
              </span>
            </div>
            <div style={{ height:4, background:borderCol, borderRadius:2, marginBottom:26, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${((qIndex)/QUIZ.length)*100}%`, background:accentGold, transition:"width 0.3s ease" }}/>
            </div>
            <h2 style={{ fontFamily:"'Fraunces', serif", fontSize: isPhone?19:22, fontWeight:600, lineHeight:1.4, marginBottom:22 }}>
              {QUIZ[qIndex].prompt}
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {QUIZ[qIndex].options.map((opt,idx)=>(
                <button key={idx} onClick={()=>selectAnswer(QUIZ[qIndex].id, idx)}
                  style={{ textAlign:"left", padding:"13px 16px", borderRadius:9, border:`1px solid ${borderCol}`, background:panelBg, color:textMain, fontSize:14.5, cursor:"pointer" }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen==="results" && (
          <div style={{ maxWidth:560, margin:"0 auto" }}>
            <div style={{ fontSize:12, letterSpacing:"0.14em", textTransform:"uppercase", color:accentGold, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
              <Sparkles size={14}/> Your placement
            </div>
            <h2 style={{ fontFamily:"'Fraunces', serif", fontSize: isPhone?26:32, fontWeight:700, margin:"0 0 8px" }}>{result.tier}</h2>
            <p style={{ color:textMuted, fontSize:14, marginBottom:10 }}>
              {result.correct} of {result.total} correct — this is a 6-question sample for the prototype; the real diagnostic runs 15–20 adaptive positions.
            </p>
            {session?.user ? (
              <p style={{ color: savedThisResult ? accentGold : textMuted, fontSize:12.5, marginBottom:20, fontFamily:"'IBM Plex Mono', monospace" }}>
                {savedThisResult ? "Saved to your account." : "Saving…"}
              </p>
            ) : (
              <p style={{ color:textMuted, fontSize:12.5, marginBottom:20 }}>
                Sign in (top right) to save this result to your account.
              </p>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:28 }}>
              {CATS.map(cat=>{
                const c = result.perCat[cat];
                const pct = c.total ? (c.correct/c.total)*100 : 0;
                return (
                  <div key={cat}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:5 }}>
                      <span style={{ color:textMain }}>{CAT_LABEL[cat]}</span>
                      <span style={{ color:textMuted, fontFamily:"'IBM Plex Mono', monospace" }}>{c.correct}/{c.total}</span>
                    </div>
                    <div style={{ height:7, background:borderCol, borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:accentGold, borderRadius:4 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <button onClick={()=>setScreen("lessons")} style={{ background:accentGold, color:"#1B2430", border:"none", borderRadius:8, padding:"12px 18px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Start Tier 1 lessons
              </button>
              <button onClick={startQuiz} style={{ background:"transparent", color:textMain, border:`1px solid ${borderCol}`, borderRadius:8, padding:"12px 18px", fontSize:14, cursor:"pointer" }}>
                Retake
              </button>
            </div>
          </div>
        )}

        {(screen==="lessons"||screen==="lessons-zk") && (
          <Lessons theme={THEMES[boardThemeKey]} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone}
            onLessonComplete={markLessonComplete} completedIds={completedIds} session={session} autoOpenFirstLesson={screen==="lessons-zk"} onShowMistakes={()=>setScreen("mistakes")} onShowGlossary={()=>setScreen("glossary")} onEarnBadge={celebrateBadge} />
        )}

        {screen==="mistakes" && (
          <BeginnerMistakes textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} onBack={()=>setScreen("lessons")} />
        )}

        {screen==="glossary" && (
          <Glossary textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} onBack={()=>setScreen("lessons")} />
        )}

        {screen==="play" && (
          <Play theme={THEMES[boardThemeKey]} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} onEarnBadge={celebrateBadge} />
        )}

        {screen==="guided" && (
          <GuidedGame theme={THEMES[boardThemeKey]} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone}
            onExit={()=>setScreen("landing")} onGoToLessons={()=>setScreen("lessons-zk")} onGoToPlay={()=>setScreen("play")} />
        )}

        {screen==="live" && (
          <LiveMatch session={session} theme={THEMES[boardThemeKey]} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} onEarnBadge={celebrateBadge} />
        )}

        {screen==="rush" && (
          <PuzzleRush session={session} theme={THEMES[boardThemeKey]} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} />
        )}

        {screen==="profile" && (
          <Profile session={session} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} />
        )}

        {screen==="admin" && (
          <Admin session={session} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} />
        )}

        {screen==="privacy" && (
          <Privacy textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} />
        )}
      </div>

      <div style={{ maxWidth:1080, margin:"0 auto", padding: isPhone ? "0 16px 24px" : "0 24px 32px", textAlign:"center" }}>
        <button onClick={()=>setScreen("privacy")} style={{ background:"transparent", border:"none", color:textMuted, fontSize:11.5, cursor:"pointer", textDecoration:"underline" }}>
          Privacy
        </button>
      </div>

      <FeedbackButton session={session} currentScreen={screen} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} />
    </div>
  );
}

function AuthControl({ session, authOpen, setAuthOpen, email, setEmail, password, setPassword, authMode, setAuthMode, authError, authLoading, submitAuth, signOut, textMain, textMuted, accentGold, borderCol, panelBg, full }) {
  if (session?.user) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, width: full ? "100%" : "auto" }}>
        <span style={{ fontSize:12, color:textMuted, fontFamily:"'IBM Plex Mono', monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140 }}>
          {session.user.email}
        </span>
        <button onClick={signOut} style={{ background:"transparent", border:`1px solid ${borderCol}`, color:textMain, borderRadius:7, padding:"7px 10px", fontSize:12, cursor:"pointer" }}>
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div style={{ position:"relative", width: full ? "100%" : "auto" }}>
      <button onClick={()=>setAuthOpen(v=>!v)} style={{ background: accentGold, color:"#1B2430", border:"none", borderRadius:7, padding:"8px 12px", fontSize:12.5, fontWeight:600, cursor:"pointer", width: full ? "100%" : "auto" }}>
        Sign in
      </button>
      {authOpen && (
        <div style={{ position: full ? "static" : "absolute", right:0, top: full ? "auto" : "calc(100% + 8px)", marginTop: full ? 8 : 0, background:panelBg, border:`1px solid ${borderCol}`, borderRadius:9, padding:12, width: full ? "100%" : 240, zIndex:20, boxSizing:"border-box" }}>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            <button onClick={()=>{setAuthMode("signin"); }} style={{ flex:1, background: authMode==="signin" ? "rgba(201,162,39,0.15)" : "transparent", border:`1px solid ${authMode==="signin"?accentGold:borderCol}`, color: authMode==="signin"?accentGold:textMuted, borderRadius:6, padding:"5px 8px", fontSize:11.5, cursor:"pointer" }}>
              Sign in
            </button>
            <button onClick={()=>{setAuthMode("signup"); }} style={{ flex:1, background: authMode==="signup" ? "rgba(201,162,39,0.15)" : "transparent", border:`1px solid ${authMode==="signup"?accentGold:borderCol}`, color: authMode==="signup"?accentGold:textMuted, borderRadius:6, padding:"5px 8px", fontSize:11.5, cursor:"pointer" }}>
              Sign up
            </button>
          </div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
            style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:6, border:`1px solid ${borderCol}`, background:"transparent", color:textMain, fontSize:13, marginBottom:8 }}/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"
            onKeyDown={(e)=>{ if(e.key==="Enter") submitAuth(); }}
            style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:6, border:`1px solid ${borderCol}`, background:"transparent", color:textMain, fontSize:13, marginBottom:8 }}/>
          <button onClick={submitAuth} disabled={authLoading} style={{ width:"100%", background:accentGold, color:"#1B2430", border:"none", borderRadius:6, padding:"8px 10px", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
            {authLoading ? "…" : authMode==="signin" ? "Sign in" : "Create account"}
          </button>
          {authError && <div style={{ fontSize:11.5, color:"#E05B5B", marginTop:7 }}>{authError}</div>}
        </div>
      )}
    </div>
  );
}

function BoardThemePicker({ boardThemeKey, setBoardThemeKey, textMuted, borderCol, panelBg, accentGold }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} title="Board theme"
        style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, borderRadius: 7, padding: "6px 9px", cursor: "pointer" }}>
        <span style={{ width: 14, height: 14, borderRadius: 3, overflow: "hidden", display: "flex" }}>
          <span style={{ width: 7, height: 14, background: THEMES[boardThemeKey].light }} />
          <span style={{ width: 7, height: 14, background: THEMES[boardThemeKey].dark }} />
        </span>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: 8, zIndex: 20, minWidth: 150 }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} onClick={() => { setBoardThemeKey(key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: boardThemeKey === key ? "rgba(201,162,39,0.12)" : "transparent", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 16, height: 16, borderRadius: 3, overflow: "hidden", display: "flex" }}>
                <span style={{ width: 8, height: 16, background: t.light }} />
                <span style={{ width: 8, height: 16, background: t.dark }} />
              </span>
              <span style={{ fontSize: 12, color: boardThemeKey === key ? accentGold : textMuted }}>{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBtn({children, active, onClick, textMain, accentGold, full}){
  return (
    <button onClick={onClick} style={{
      background: active ? "rgba(201,162,39,0.12)" : "transparent",
      color: active ? accentGold : textMain,
      border:"none", borderRadius:7, padding: full ? "10px 12px" : "8px 12px",
      fontSize:13.5, fontWeight: active?600:500, cursor:"pointer",
      width: full ? "100%" : "auto", textAlign: full ? "left" : "center"
    }}>
      {children}
    </button>
  );
}

// A single dismissible coach-mark for the first-visit nav walkthrough.
// Positioned in the viewport (not the document) using the target nav
// item's live bounding rect, so it tracks correctly whether the nav is
// the sticky desktop bar or the expanded mobile menu.
function WalkthroughTooltip({ rect, step, stepNumber, totalSteps, isLast, onNext, onSkip, isPhone, textMain, textMuted, panelBg, borderCol, accentGold }) {
  const width = isPhone ? 236 : 270;
  const maxLeft = window.innerWidth - width - 12;
  const left = Math.max(12, Math.min(rect.left, maxLeft));
  const top = rect.bottom + 10;
  const arrowLeft = Math.max(14, Math.min(rect.left + rect.width / 2 - left, width - 14));

  return (
    <div style={{ position:"fixed", top, left, width, zIndex:30, background:panelBg, border:`1px solid ${accentGold}`, borderRadius:10, padding:"14px 16px", boxShadow:"0 14px 34px rgba(0,0,0,0.4)" }}>
      <div style={{ position:"absolute", top:-7, left:arrowLeft, width:12, height:12, background:panelBg, borderLeft:`1px solid ${accentGold}`, borderTop:`1px solid ${accentGold}`, transform:"rotate(45deg)" }} />
      <div style={{ fontSize:10.5, letterSpacing:"0.1em", textTransform:"uppercase", color:accentGold, marginBottom:6, fontFamily:"'IBM Plex Mono', monospace" }}>
        {step.label} · {stepNumber} of {totalSteps}
      </div>
      <p style={{ margin:0, fontSize:13, lineHeight:1.5, color:textMain }}>{step.text}</p>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
        <button onClick={onSkip} style={{ background:"transparent", border:"none", color:textMuted, fontSize:12, cursor:"pointer", padding:0 }}>
          Skip tour
        </button>
        <button onClick={onNext} style={{ background:accentGold, color:"#1B2430", border:"none", borderRadius:6, padding:"7px 13px", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
          {isLast ? "Got it" : "Next"}
        </button>
      </div>
    </div>
  );
}

// A celebratory toast for a newly-earned badge. Fixed to the viewport
// so it's visible regardless of scroll position, auto-dismissed by the
// timer in the App shell, but also closeable by hand.
function BadgeToast({ badge, onDismiss, isPhone, textMain, textMuted, panelBg, borderCol, accentGold }) {
  return (
    <div style={{
      position: "fixed", zIndex: 40,
      bottom: isPhone ? 16 : 24, right: isPhone ? 16 : 24, left: isPhone ? 16 : "auto",
      width: isPhone ? "auto" : 300,
      background: panelBg, border: `1.5px solid ${accentGold}`, borderRadius: 12, padding: "14px 16px",
      boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ fontSize: 28, lineHeight: 1 }}>{badge.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: accentGold, marginBottom: 3, fontFamily: "'IBM Plex Mono', monospace" }}>
          Badge earned
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: textMain, marginBottom: 2 }}>{badge.label}</div>
        <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.4 }}>{badge.desc}</div>
      </div>
      <button onClick={onDismiss} style={{ background: "transparent", border: "none", color: textMuted, cursor: "pointer", fontSize: 15, padding: 0, lineHeight: 1 }} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
