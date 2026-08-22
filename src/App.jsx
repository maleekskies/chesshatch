import { useState, useEffect, useMemo } from "react";
import { supabase } from "./lib/supabaseClient.js";
import Play from "./screens/Play.jsx";
import Lessons, { PuzzleView } from "./screens/Lessons.jsx";
import LiveMatch from "./screens/LiveMatch.jsx";
import Admin from "./screens/Admin.jsx";
import Privacy from "./screens/Privacy.jsx";
import FeedbackButton from "./components/FeedbackButton.jsx";
import { SAMPLE_PUZZLES } from "./data/lessons.js";
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
  walnut: { name: "Walnut", light: "#EDE6D6", dark: "#8B5E3C", accent: "#C9A227" },
  ocean: { name: "Ocean", light: "#E8F1F5", dark: "#2E6E8E", accent: "#F2A65A" },
  slate: { name: "Slate", light: "#E4E4E7", dark: "#52525B", accent: "#F59E0B" },
  forest: { name: "Forest", light: "#EAF0E3", dark: "#3F6B3F", accent: "#D97706" },
  highContrast: { name: "Colorblind-safe", light: "#F0E9DA", dark: "#2B6CB0", accent: "#DD6B20" },
};

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

  // ---- Supabase auth (magic link) ----
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [authStatus, setAuthStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
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

  async function sendMagicLink() {
    if (!email) return;
    setAuthStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({ email });
    setAuthStatus(error ? "error" : "sent");
  }
  async function signOut() {
    await supabase.auth.signOut();
    setAuthOpen(false);
  }

  async function markLessonComplete(lessonId) {
    setCompletedIds((prev) => new Set(prev).add(lessonId));
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
    <div style={{ minHeight:"100%", background:pageBg, color:textMain, fontFamily:"'Inter', system-ui, sans-serif" }}>
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
              <NavBtn active={screen==="diagnostic"||screen==="results"} onClick={startQuiz} textMain={textMain} accentGold={accentGold}>Diagnostic</NavBtn>
              <NavBtn active={screen==="lessons"} onClick={()=>setScreen("lessons")} textMain={textMain} accentGold={accentGold}>Lessons</NavBtn>
              <NavBtn active={screen==="play"} onClick={()=>setScreen("play")} textMain={textMain} accentGold={accentGold}>Play</NavBtn>
              <NavBtn active={screen==="live"} onClick={()=>setScreen("live")} textMain={textMain} accentGold={accentGold}>Live</NavBtn>
              {session?.user?.email === "maleekade775@gmail.com" && (
                <NavBtn active={screen==="admin"} onClick={()=>setScreen("admin")} textMain={textMain} accentGold={accentGold}>Admin</NavBtn>
              )}
              <AuthControl session={session} authOpen={authOpen} setAuthOpen={setAuthOpen} email={email} setEmail={setEmail}
                authStatus={authStatus} sendMagicLink={sendMagicLink} signOut={signOut}
                textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} panelBg={panelBg}/>
            </div>
          )}
        </div>
        {isPhone && navOpen && (
          <div style={{ padding:"0 16px 14px", display:"flex", flexDirection:"column", gap:6 }}>
            <NavBtn full active={screen==="landing"} onClick={()=>{setScreen("landing"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Home</NavBtn>
            <NavBtn full active={screen==="diagnostic"||screen==="results"} onClick={()=>{startQuiz(); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Diagnostic</NavBtn>
            <NavBtn full active={screen==="lessons"} onClick={()=>{setScreen("lessons"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Lessons</NavBtn>
            <NavBtn full active={screen==="play"} onClick={()=>{setScreen("play"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Play</NavBtn>
            <NavBtn full active={screen==="live"} onClick={()=>{setScreen("live"); setNavOpen(false);}} textMain={textMain} accentGold={accentGold}>Live</NavBtn>
            <div style={{ marginTop:6 }}>
              <AuthControl session={session} authOpen={authOpen} setAuthOpen={setAuthOpen} email={email} setEmail={setEmail}
                authStatus={authStatus} sendMagicLink={sendMagicLink} signOut={signOut}
                textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} panelBg={panelBg} full/>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth:1080, margin:"0 auto", padding: isPhone ? "24px 16px 48px" : "40px 24px 64px" }}>

        {screen==="landing" && dailyPuzzleOpen && (
          <div style={{ maxWidth: 700 }}>
            <button onClick={()=>setDailyPuzzleOpen(false)} style={{ background:"transparent", border:"none", color:textMuted, fontSize:12.5, cursor:"pointer", marginBottom:14, padding:0 }}>
              ← Back
            </button>
            <div style={{ fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:accentGold, marginBottom:10 }}>Today's Puzzle</div>
            <PuzzleView puzzle={dailyPuzzle()} theme={THEMES.walnut} textMain={textMain} textMuted={textMuted} accentGold={accentGold} borderCol={borderCol} isPhone={isPhone} session={session} onBack={()=>setDailyPuzzleOpen(false)} />
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

        {screen==="lessons" && (
          <Lessons theme={THEMES.walnut} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone}
            onLessonComplete={markLessonComplete} completedIds={completedIds} session={session} />
        )}

        {screen==="play" && (
          <Play theme={THEMES.walnut} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} />
        )}

        {screen==="live" && (
          <LiveMatch session={session} theme={THEMES.walnut} textMain={textMain} textMuted={textMuted} panelBg={panelBg} borderCol={borderCol} accentGold={accentGold} isPhone={isPhone} />
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

function AuthControl({ session, authOpen, setAuthOpen, email, setEmail, authStatus, sendMagicLink, signOut, textMain, textMuted, accentGold, borderCol, panelBg, full }) {
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
          <div style={{ fontSize:11.5, color:textMuted, marginBottom:8 }}>Beta tester sign-in — we'll email you a magic link, no password needed.</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
            style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:6, border:`1px solid ${borderCol}`, background:"transparent", color:textMain, fontSize:13, marginBottom:8 }}/>
          <button onClick={sendMagicLink} disabled={authStatus==="sending"} style={{ width:"100%", background:accentGold, color:"#1B2430", border:"none", borderRadius:6, padding:"8px 10px", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
            {authStatus==="sending" ? "Sending…" : "Send magic link"}
          </button>
          {authStatus==="sent" && <div style={{ fontSize:11.5, color:accentGold, marginTop:7 }}>Check your email for the link.</div>}
          {authStatus==="error" && <div style={{ fontSize:11.5, color:"#E05B5B", marginTop:7 }}>Something went wrong — try again.</div>}
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
