import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient.js";
import Play from "./screens/Play.jsx";
import Lessons, { PuzzleView } from "./screens/Lessons.jsx";
import ChessBoard from "./components/ChessBoard.jsx";
import LiveMatch from "./screens/LiveMatch.jsx";
import PuzzleRush from "./screens/PuzzleRush.jsx";
import Profile from "./screens/Profile.jsx";
import Admin from "./screens/Admin.jsx";
import Privacy from "./screens/Privacy.jsx";
import GuidedGame from "./screens/GuidedGame.jsx";
import BeginnerMistakes from "./screens/BeginnerMistakes.jsx";
import NotFound from "./screens/NotFound.jsx";
import Glossary from "./screens/Glossary.jsx";
import { BADGES, awardBadge } from "./lib/badges.js";
import FeedbackButton from "./components/FeedbackButton.jsx";
import { SAMPLE_PUZZLES, TIER1_LESSONS } from "./data/lessons.js";
import { DIAGNOSTIC_BEGINNER_POOL } from "./data/diagnosticPool.js";
import { getFeedbackMode, setFeedbackMode as persistFeedbackMode } from "./lib/moveFeedback.js";
import {
  Menu, X, ChevronRight, Target, BookOpen, TrendingUp, Sparkles, Crown, Users
} from "lucide-react";

function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
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
// this is per-browser, not per-account, it resets if the person clears
// their browser data or switches devices. A cross-device version would
// need to read/write this from Supabase per user instead; this is the
// lightweight v1.
function useStreak() {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("chessloop_last_visit");
    const prevStreak = parseInt(localStorage.getItem("chessloop_streak") || "0", 10);
    if (last === today) {
      setStreak(prevStreak);
      return;
    }
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = last === yesterday ? prevStreak + 1 : 1;
    localStorage.setItem("chessloop_last_visit", today);
    localStorage.setItem("chessloop_streak", String(newStreak));
    setStreak(newStreak);
  }, []);
  return streak;
}

// Deterministic "puzzle of the day", same puzzle for everyone on a
// given calendar day, picked from the sample set by date rather than
// randomly, so it's actually the same daily puzzle across visits.
function dailyPuzzle() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return SAMPLE_PUZZLES[dayIndex % SAMPLE_PUZZLES.length];
}

// ================= Board themes (used by Play + Lessons boards) =================
const THEMES = {
  brown: { name: "Brown", light: "#F0D9B5", dark: "#B58863" },
  blue: { name: "Blue", light: "#DEE3E6", dark: "#8CA2AD" },
  green: { name: "Green", light: "#EEEED2", dark: "#769656" },
  highContrast: { name: "Colorblind-safe", light: "#F0E9DA", dark: "#2B6CB0" },
};
// Brown and Blue match Lichess's actual published values; Green matches
// the widely-used standard chess-board green palette; the accent UI
// color (used for highlights/buttons, not the board itself) is
// ChessLoop's own, not Lichess's.

// ================= Diagnostic quiz content =================
// The quiz draws from DIAGNOSTIC_BEGINNER_POOL (src/data/diagnosticPool.js),
// a pool of over 100 real chess positions rather than a fixed set of
// text trivia questions. Each attempt samples a fresh, balanced subset
// (see sampleQuizQuestions below), so retaking the quiz shows genuinely
// different questions, not the same six every time.
const QUIZ_LENGTH = 12;
const CATS = ["rules","tactics","endgame","positional"];
const CAT_LABEL = { rules:"Rules", tactics:"Tactics", endgame:"Endgames", positional:"Positional" };

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draws a balanced sample across all 4 categories (3 from each, for a
// 12-question quiz) rather than a purely random draw, since a purely
// random draw would skew toward whichever category happens to have the
// most entries in the underlying pool.
function sampleQuizQuestions() {
  const perCat = Math.floor(QUIZ_LENGTH / CATS.length);
  let sampled = [];
  CATS.forEach((cat) => {
    const catPool = DIAGNOSTIC_BEGINNER_POOL.filter((q) => q.cat === cat);
    sampled = sampled.concat(shuffleArray(catPool).slice(0, perCat));
  });
  return shuffleArray(sampled);
}

// ================= First-visit nav walkthrough =================
// A short, dismissible tour that points at the three nav items a brand
// new visitor most needs to notice. Shown once per browser (localStorage
// flag), same per-browser, not per-account, limitation as the streak
// counter above.
const WALKTHROUGH_DISMISSED_KEY = "chessloop_walkthrough_dismissed";
const WALKTHROUGH_STEPS = [
  { key:"diagnostic", label:"Diagnostic", text:"Not sure where to start? A short quiz places you at the right level." },
  { key:"lessons", label:"Lessons", text:"Step-by-step lessons, from how pieces move up to real tactics, with a live coach watching your moves." },
  { key:"play", label:"Play", text:"Play freely against a friend on the same device, or against the built-in computer at any difficulty." },
];

function scoreQuiz(answers, questions){
  const perCat = {}; CATS.forEach(c=>perCat[c]={correct:0,total:0});
  let correct=0;
  questions.forEach(q=>{
    perCat[q.cat].total += 1;
    if(answers[q.id]===q.answer){ correct+=1; perCat[q.cat].correct+=1; }
  });
  const total = questions.length || 1;
  const pct = correct/total;
  let tier = "Complete Beginner";
  if(pct>0.8) tier="Advanced";
  else if(pct>0.5) tier="Intermediate";
  else if(pct>0.25) tier="Casual Improver";
  return { correct, total, pct, perCat, tier };
}

// ================= Real URL routing =================
// Every screen gets an actual URL rather than living only in memory, so
// the browser's back and forward buttons work, a refresh keeps you
// where you were instead of dumping you back to the landing page, and
// a link to a specific screen is shareable. This maps each "screen"
// name (used throughout this file exactly as before) to a real path,
// and back. `screen` is derived from the current URL on every render,
// and `setScreen` below is a thin wrapper around the router's
// `navigate`, so nothing else in this file has to change.
const PATH_TO_SCREEN = {
  "/": "landing",
  "/diagnostic": "diagnostic",
  "/results": "results",
  "/lessons": "lessons",
  "/lessons/start": "lessons-zk",
  "/guided": "guided",
  "/mistakes": "mistakes",
  "/glossary": "glossary",
  "/play": "play",
  "/live": "live",
  "/rush": "rush",
  "/profile": "profile",
  "/admin": "admin",
  "/privacy": "privacy",
};
const SCREEN_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_SCREEN).map(([path, screenName]) => [screenName, path])
);

// Title and meta description per screen, so a browser tab, history
// entry, or bookmark for one page doesn't look identical to another.
const SITE_HOST = "https://chessloop.vercel.app";
const SCREEN_META = {
  landing: { title: "ChessLoop", description: "Learn chess from your first move to real tactics, at your own pace." },
  diagnostic: { title: "Diagnostic quiz, ChessLoop", description: "A short quiz that places you at the right starting level, across rules, tactics, endgames, and positional play." },
  results: { title: "Your results, ChessLoop", description: "Your diagnostic quiz results and recommended starting tier." },
  lessons: { title: "Lessons, ChessLoop", description: "Step by step chess lessons from complete beginner through intermediate tactics and endgames." },
  "lessons-zk": { title: "Lesson 1, ChessLoop", description: "Start from the very beginning: how each piece moves, one step at a time." },
  guided: { title: "Guided first game, ChessLoop", description: "A short scripted mini match with a live coach explaining every move, for a first hands on game." },
  mistakes: { title: "Common beginner mistakes, ChessLoop", description: "The mistakes that decide most beginner games, and what to do instead." },
  glossary: { title: "Glossary, ChessLoop", description: "Chess terms used across ChessLoop's lessons and coaching, in one place." },
  play: { title: "Play, ChessLoop", description: "Play a practice game with a live coach, or play against the built in computer at any difficulty." },
  live: { title: "Live match, ChessLoop", description: "Real time chess matches against another signed in player, with time controls and ratings." },
  rush: { title: "Puzzle Rush, ChessLoop", description: "Solve as many puzzles as you can before the clock runs out." },
  profile: { title: "Profile, ChessLoop", description: "Your ratings, lessons mastered, and earned badges." },
  admin: { title: "Admin, ChessLoop", description: "Tester activity and feedback." },
  privacy: { title: "Privacy, ChessLoop", description: "What ChessLoop collects and how it's used during the closed beta." },
  notfound: { title: "Page not found, ChessLoop", description: "This page doesn't exist." },
};

// ================= App shell =================
export default function ChessLoopApp(){
  useFonts();
  const width = useWindowWidth();
  const streak = useStreak();
  const isPhone = width < 560;

  const location = useLocation();
  const navigate = useNavigate();
  const screen = PATH_TO_SCREEN[location.pathname] || (location.pathname === "/" ? "landing" : "notfound");
  function setScreen(nextScreen) {
    const path = SCREEN_TO_PATH[nextScreen] || "/";
    if (path !== location.pathname) navigate(path);
  }

  useEffect(() => {
    const meta = SCREEN_META[screen] || SCREEN_META.landing;
    document.title = meta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", meta.description);
    const canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) canonicalTag.setAttribute("href", SITE_HOST + location.pathname);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", meta.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", meta.description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", SITE_HOST + location.pathname);
  }, [screen, location.pathname]);

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizQuestions, setQuizQuestions] = useState(() => sampleQuizQuestions());
  const [navOpen, setNavOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [dailyPuzzleOpen, setDailyPuzzleOpen] = useState(false);
  const [boardThemeKey, setBoardThemeKey] = useState("brown");
  const [feedbackMode, setFeedbackModeState] = useState(() => getFeedbackMode());
  function updateFeedbackMode(mode) {
    persistFeedbackMode(mode);
    setFeedbackModeState(mode);
  }

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
  // mobile menu open/closed state, or the viewport width changes, and
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

  const pageBg = "#FFF8EF";
  const panelBg = "#FFFFFF";
  const textMain = "#2B2620";
  const textMuted = "#6B6355";
  const borderCol = "#ECE4D6";
  const accentGold = "#E2694B";

  const result = useMemo(()=> scoreQuiz(answers, quizQuestions), [answers, quizQuestions]);

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
      if(qIndex < quizQuestions.length-1) setQIndex(i=>i+1);
      else setScreen("results");
    }, 250);
  }

  function startQuiz(){ setAnswers({}); setQIndex(0); setQuizQuestions(sampleQuizQuestions()); setScreen("diagnostic"); setSavedThisResult(false); }

  return (
    <div style={{ minHeight:"100%", background:pageBg, color:textMain, fontFamily:"'Inter', system-ui, sans-serif", overflowX:"hidden" }}>
      {/* Nav */}
      <div role="navigation" aria-label="Main navigation" style={{ borderBottom:`1px solid ${borderCol}`, position:"sticky", top:0, background:pageBg, zIndex:10, paddingTop:"env(safe-area-inset-top)" }}>
        <div style={{ maxWidth:1080, margin:"0 auto", padding: isPhone ? "12px 16px" : "14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div onClick={()=>setScreen("landing")} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:8, background:accentGold, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Crown size={16} color="#FFFFFF"/>
            </div>
            <span style={{ fontFamily:"'Poppins', sans-serif", fontWeight:600, fontSize:17 }}>ChessLoop</span>
          </div>

          {isPhone ? (
            <button onClick={()=>setNavOpen(v=>!v)} aria-label={navOpen ? "Close menu" : "Open menu"} style={{ background:"transparent", border:"none", color:textMain, cursor:"pointer", padding:11, margin:-11, display:"flex", alignItems:"center", justifyContent:"center" }}>
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
              <MoveFeedbackPicker feedbackMode={feedbackMode} setFeedbackModeState={updateFeedbackMode} textMuted={textMuted} borderCol={borderCol} panelBg={panelBg} accentGold={accentGold} />
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
            <div style={{ padding:"6px 12px", display:"flex", gap:8 }}>
              <BoardThemePicker boardThemeKey={boardThemeKey} setBoardThemeKey={setBoardThemeKey} textMuted={textMuted} borderCol={borderCol} panelBg={panelBg} accentGold={accentGold} />
              <MoveFeedbackPicker feedbackMode={feedbackMode} setFeedbackModeState={updateFeedbackMode} textMuted={textMuted} borderCol={borderCol} panelBg={panelBg} accentGold={accentGold} />
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
            <div style={{ display:"inline-block", background:"rgba(78,122,58,0.12)", color:"#4E7A3A", fontFamily:"'Poppins', sans-serif", fontSize:12, fontWeight:600, padding:"6px 14px", borderRadius:20, marginBottom:18 }}>
              Learn, play, master
            </div>
            <h1 style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize: isPhone?28:42, lineHeight:1.25, margin:0, maxWidth:600 }}>
              A calm, clear way to actually get better at chess.
            </h1>
            <p style={{ color:textMuted, fontSize: isPhone?14:16, lineHeight:1.7, marginTop:16, maxWidth:540 }}>
              No pressure, no overwhelming pile of puzzles. Just a simple next
              step, matched to where you are right now.
            </p>

            <p style={{ fontSize:14, fontWeight:600, color:textMain, marginTop: isPhone?32:40, marginBottom:16 }}>
              Where would you like to start?
            </p>

            <div style={{ display:"grid", gridTemplateColumns: isPhone ? "1fr" : "repeat(3, 1fr)", gap:18 }}>
              <div style={{ background:panelBg, borderRadius:24, padding: isPhone ? 22 : 26, display:"flex", flexDirection:"column", boxShadow:"0 4px 18px rgba(43,38,32,0.06)" }}>
                <div style={{ width:46, height:46, borderRadius:16, background:"rgba(226,105,75,0.14)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                  <BookOpen size={20} color={accentGold}/>
                </div>
                <div style={{ fontWeight:700, fontSize:16.5, marginBottom:8 }}>I'm new to chess</div>
                <p style={{ color:textMuted, fontSize:13.5, lineHeight:1.6, marginBottom:20, flexGrow:1 }}>
                  Start from the very beginning: how each piece moves, one gentle step at a time.
                </p>
                <button onClick={()=>setScreen("lessons-zk")} style={{ background:accentGold, color:"#FFFFFF", border:"none", borderRadius:16, padding:"13px 16px", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  Start with the basics <ChevronRight size={15}/>
                </button>
                <button onClick={()=>setScreen("guided")} style={{ background:"transparent", border:"none", color:textMuted, fontSize:12, padding:0, marginTop:12, cursor:"pointer", textDecoration:"underline", textUnderlineOffset:3 }}>
                  Or try a short guided first game
                </button>
              </div>

              <div style={{ background:panelBg, borderRadius:24, padding: isPhone ? 22 : 26, display:"flex", flexDirection:"column", boxShadow:"0 4px 18px rgba(43,38,32,0.06)" }}>
                <div style={{ width:46, height:46, borderRadius:16, background:"rgba(78,122,58,0.12)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                  <Target size={20} color="#4E7A3A"/>
                </div>
                <div style={{ fontWeight:700, fontSize:16.5, marginBottom:8 }}>I already know the rules</div>
                <p style={{ color:textMuted, fontSize:13.5, lineHeight:1.6, marginBottom:20, flexGrow:1 }}>
                  Take a short, friendly quiz so lessons can start at the right level for you, not too easy, not too hard.
                </p>
                <button onClick={startQuiz} style={{ background:"#F4F2EC", color:textMain, border:"none", borderRadius:16, padding:"13px 16px", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  Find my level <ChevronRight size={15}/>
                </button>
              </div>

              <div style={{ background:panelBg, borderRadius:24, padding: isPhone ? 22 : 26, display:"flex", flexDirection:"column", boxShadow:"0 4px 18px rgba(43,38,32,0.06)" }}>
                <div style={{ width:46, height:46, borderRadius:16, background:"rgba(74,99,194,0.12)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                  <Users size={20} color="#4A63C2"/>
                </div>
                <div style={{ fontWeight:700, fontSize:16.5, marginBottom:8 }}>I just want to play</div>
                <p style={{ color:textMuted, fontSize:13.5, lineHeight:1.6, marginBottom:20, flexGrow:1 }}>
                  Jump straight into a game against a friend or the computer, no setup needed.
                </p>
                <button onClick={()=>setScreen("play")} style={{ background:"#F4F2EC", color:textMain, border:"none", borderRadius:16, padding:"13px 16px", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  Start a game <ChevronRight size={15}/>
                </button>
                <button onClick={()=>{ setDailyPuzzleOpen(true); setScreen("landing"); }} style={{ background:"transparent", border:"none", color:textMuted, fontSize:12, padding:0, marginTop:12, cursor:"pointer", textDecoration:"underline", textUnderlineOffset:3 }}>
                  Or solve today's puzzle
                </button>
              </div>
            </div>

            {streak > 1 && (
              <div style={{ marginTop:22, display:"inline-flex", alignItems:"center", gap:6, background:panelBg, boxShadow:"0 2px 10px rgba(43,38,32,0.06)", borderRadius:20, padding:"8px 14px", fontSize:12.5, color:textMuted }}>
                🔥 <span style={{ color:textMain, fontWeight:600 }}>{streak} day streak</span>
              </div>
            )}

            <div style={{ marginTop: isPhone?40:56, paddingTop: isPhone?28:36, borderTop:`1px solid ${borderCol}` }}>
              <p style={{ fontSize:13, fontWeight:600, color:textMuted, marginBottom:16 }}>
                Why ChessLoop feels different
              </p>
              <div style={{ display:"grid", gridTemplateColumns: isPhone ? "1fr" : "repeat(3, 1fr)", gap:16 }}>
                {[
                  { icon:<Target size={18} color={accentGold}/>, title:"Placed at your level", desc:"A short quiz finds where you really are across tactics, endgames, and rules, so nothing feels too easy or too hard." },
                  { icon:<BookOpen size={18} color={accentGold}/>, title:"Real lessons, not just puzzles", desc:"Piece movement, mate patterns, and tactics, explained one calm step at a time, with a live coach watching your moves." },
                  { icon:<TrendingUp size={18} color={accentGold}/>, title:"Practice that sticks", desc:"Every lesson ends with a matched puzzle, so what you just learned actually stays with you." },
                ].map((f,i)=>(
                  <div key={i} style={{ background:panelBg, borderRadius:18, padding:18, boxShadow:"0 2px 12px rgba(43,38,32,0.05)" }}>
                    <div style={{ marginBottom:10 }}>{f.icon}</div>
                    <div style={{ fontWeight:600, fontSize:14.5, marginBottom:6 }}>{f.title}</div>
                    <div style={{ color:textMuted, fontSize:13, lineHeight:1.6 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen==="diagnostic" && quizQuestions[qIndex] && (
          <div style={{ maxWidth:560, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <span style={{ fontSize:12, color:textMuted, fontFamily:"'IBM Plex Mono', monospace" }}>
                Question {qIndex+1} of {quizQuestions.length}
              </span>
              <span style={{ fontSize:11, color:accentGold, fontFamily:"'IBM Plex Mono', monospace", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                {CAT_LABEL[quizQuestions[qIndex].cat]}
              </span>
            </div>
            <div style={{ height:4, background:borderCol, borderRadius:2, marginBottom:26, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${((qIndex)/quizQuestions.length)*100}%`, background:accentGold, transition:"width 0.3s ease" }}/>
            </div>
            <h2 style={{ fontFamily:"'Poppins', sans-serif", fontSize: isPhone?19:22, fontWeight:600, lineHeight:1.4, marginBottom: quizQuestions[qIndex].fen ? 18 : 22 }}>
              {quizQuestions[qIndex].prompt}
            </h2>
            {quizQuestions[qIndex].fen && (
              <div style={{ display:"flex", justifyContent:"center", marginBottom:22 }}>
                <ChessBoard
                  fen={quizQuestions[qIndex].fen}
                  theme={THEMES[boardThemeKey]}
                  boardWidth={isPhone ? Math.min(280, window.innerWidth - 64) : 320}
                  arePiecesDraggable={false}
                />
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {quizQuestions[qIndex].options.map((opt,idx)=>(
                <button key={idx} onClick={()=>selectAnswer(quizQuestions[qIndex].id, idx)}
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
            <h2 style={{ fontFamily:"'Poppins', sans-serif", fontSize: isPhone?26:32, fontWeight:700, margin:"0 0 8px" }}>{result.tier}</h2>
            <p style={{ color:textMuted, fontSize:14, marginBottom:10 }}>
              {result.correct} of {result.total} correct. Each attempt draws a fresh, balanced set from a pool of over {DIAGNOSTIC_BEGINNER_POOL.length} verified positions, so retaking the quiz shows different questions.
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
              <button onClick={()=>setScreen("lessons")} style={{ background:accentGold, color:"#FFFFFF", border:"none", borderRadius:8, padding:"12px 18px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
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

        {screen==="notfound" && (
          <NotFound textMain={textMain} textMuted={textMuted} accentGold={accentGold} isPhone={isPhone} onGoHome={()=>setScreen("landing")} />
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
        <button onClick={signOut} style={{ background:"transparent", border:`1px solid ${borderCol}`, color:textMain, borderRadius:9, padding:"7px 10px", fontSize:12, cursor:"pointer" }}>
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div style={{ position:"relative", width: full ? "100%" : "auto" }}>
      <button onClick={()=>setAuthOpen(v=>!v)} style={{ background: accentGold, color:"#FFFFFF", border:"none", borderRadius:9, padding:"8px 12px", fontSize:12.5, fontWeight:600, cursor:"pointer", width: full ? "100%" : "auto" }}>
        Sign in
      </button>
      {authOpen && (
        <div style={{ position: full ? "static" : "absolute", right:0, top: full ? "auto" : "calc(100% + 8px)", marginTop: full ? 8 : 0, background:panelBg, border:`1px solid ${borderCol}`, borderRadius:9, padding:12, width: full ? "100%" : 240, zIndex:20, boxSizing:"border-box" }}>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            <button onClick={()=>{setAuthMode("signin"); }} style={{ flex:1, background: authMode==="signin" ? "rgba(226,105,75,0.15)" : "transparent", border:`1px solid ${authMode==="signin"?accentGold:borderCol}`, color: authMode==="signin"?accentGold:textMuted, borderRadius:6, padding:"5px 8px", fontSize:11.5, cursor:"pointer" }}>
              Sign in
            </button>
            <button onClick={()=>{setAuthMode("signup"); }} style={{ flex:1, background: authMode==="signup" ? "rgba(226,105,75,0.15)" : "transparent", border:`1px solid ${authMode==="signup"?accentGold:borderCol}`, color: authMode==="signup"?accentGold:textMuted, borderRadius:6, padding:"5px 8px", fontSize:11.5, cursor:"pointer" }}>
              Sign up
            </button>
          </div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
            style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:6, border:`1px solid ${borderCol}`, background:"transparent", color:textMain, fontSize:13, marginBottom:8 }}/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"
            onKeyDown={(e)=>{ if(e.key==="Enter") submitAuth(); }}
            style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:6, border:`1px solid ${borderCol}`, background:"transparent", color:textMain, fontSize:13, marginBottom:8 }}/>
          <button onClick={submitAuth} disabled={authLoading} style={{ width:"100%", background:accentGold, color:"#FFFFFF", border:"none", borderRadius:6, padding:"8px 10px", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
            {authLoading ? "…" : authMode==="signin" ? "Sign in" : "Create account"}
          </button>
          {authError && <div style={{ fontSize:11.5, color:"#E05B5B", marginTop:7 }}>{authError}</div>}
        </div>
      )}
    </div>
  );
}

function MoveFeedbackPicker({ feedbackMode, setFeedbackModeState, textMuted, borderCol, panelBg, accentGold }) {
  const [open, setOpen] = useState(false);
  const MODES = [
    { key: "sound", label: "Sound", emoji: "🔊" },
    { key: "vibration", label: "Vibration", emoji: "📳" },
    { key: "silent", label: "Silent", emoji: "🔇" },
  ];
  const current = MODES.find((m) => m.key === feedbackMode) || MODES[0];
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} title="Move sound and vibration" aria-label="Move sound and vibration settings"
        style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${borderCol}`, borderRadius: 7, padding: "6px 9px", cursor: "pointer" }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>{current.emoji}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: panelBg, border: `1px solid ${borderCol}`, borderRadius: 9, padding: 8, zIndex: 20, minWidth: 150 }}>
          {MODES.map((m) => (
            <button key={m.key} onClick={() => { setFeedbackModeState(m.key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: feedbackMode === m.key ? "rgba(226,105,75,0.12)" : "transparent", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>{m.emoji}</span>
              <span style={{ fontSize: 12, color: feedbackMode === m.key ? accentGold : textMuted }}>{m.label}</span>
            </button>
          ))}
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
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: boardThemeKey === key ? "rgba(226,105,75,0.12)" : "transparent", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "left" }}>
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
      background: active ? "rgba(226,105,75,0.12)" : "transparent",
      color: active ? accentGold : textMain,
      border:"none", borderRadius:20, padding: full ? "10px 14px" : "8px 14px",
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
        <button onClick={onNext} style={{ background:accentGold, color:"#FFFFFF", border:"none", borderRadius:6, padding:"7px 13px", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
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
      bottom: isPhone ? "calc(16px + env(safe-area-inset-bottom))" : 24, right: isPhone ? 16 : 24, left: isPhone ? 16 : "auto",
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
      <button onClick={onDismiss} style={{ background: "transparent", border: "none", color: textMuted, cursor: "pointer", fontSize: 15, padding: 10, margin: -10, lineHeight: 1 }} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
