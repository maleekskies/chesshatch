// The intro at "/": a four-second opening sequence, then straight into
// the app.
//
// This replaced the old looping video landing page. It is deliberately
// still outside the app shell (see src/main.jsx) so nothing about the
// existing screens had to change.
//
// The moves are not hand-animated or faked. They are played through
// chess.js one at a time, exactly like every other board in the app,
// and only the resulting FEN is handed to the board. `buildPositions`
// throws at import time if any move in the list were illegal, so a typo
// in the opening can never ship as a board that silently shows a
// position that isn't reachable.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import ChessBoard from "../components/ChessBoard.jsx";
import { useViewport, fitBoard } from "../lib/boardSize.js";
import "./motionLanding.css";

const HOME_PATH = "/home";
const DESCRIPTION = "Learn chess from your first move to real tactics, at your own pace.";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";

// 1. e4 e5 2. Nf3 Nc6 3. Bc4, in standard algebraic notation.
const OPENING = ["e4", "e5", "Nf3", "Nc6", "Bc4"];
const STEP_MS = 600; // one move per step: start 0.0s, e4 0.6s, ... Bc4 3.0s
const HOLD_MS = 1000; // hold the final position, handing over at 4.0s
const FADE_MS = 420; // cross-fade into the app
const REDUCED_MOTION_HOLD_MS = 1000;

function buildPositions() {
  const game = new Chess();
  const positions = [game.fen()];
  const sans = [];
  for (const san of OPENING) {
    const move = game.move(san);
    if (!move) throw new Error(`Chess Hatch intro: "${san}" is not a legal move in this position`);
    positions.push(game.fen());
    sans.push(move.san);
  }
  return { positions, sans };
}

const OPENING_SEQUENCE = buildPositions();

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    if (query.addEventListener) query.addEventListener("change", onChange);
    else query.addListener(onChange);
    return () => {
      if (query.removeEventListener) query.removeEventListener("change", onChange);
      else query.removeListener(onChange);
    };
  }, []);
  return reduced;
}

const BOARD_THEME = { light: "#F0D9B5", dark: "#B58863" };

export default function MotionLanding() {
  const navigate = useNavigate();
  const { width: viewportW, height: viewportH } = useViewport();
  const reducedMotion = usePrefersReducedMotion();

  const [ply, setPly] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const leftRef = useRef(false);

  // Page-level metadata for the one screen that lives outside App.jsx.
  // All of it is restored on the way out.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Chess Hatch";

    const descTag = document.querySelector('meta[name="description"]');
    const prevDesc = descTag ? descTag.getAttribute("content") : null;
    if (descTag) descTag.setAttribute("content", DESCRIPTION);

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = FONT_HREF;
    document.head.appendChild(fontLink);

    document.body.classList.add("ml-body");

    return () => {
      document.title = previousTitle;
      if (descTag && prevDesc !== null) descTag.setAttribute("content", prevDesc);
      if (fontLink.parentNode) fontLink.parentNode.removeChild(fontLink);
      document.body.classList.remove("ml-body");
    };
  }, []);

  // Leaving is one-way: the intro plays once per page entry and then
  // hands over. `leftRef` makes that true even if the timer, the skip
  // button and an unmount all race each other.
  const leave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    setLeaving(true);
    window.setTimeout(() => navigate(HOME_PATH, { replace: true }), FADE_MS);
  }, [navigate]);

  useEffect(() => {
    const timers = [];
    // Someone who has asked their system for less motion gets the
    // starting position for a beat instead of the animation, then the
    // same hand-off. The intro never simply blocks them.
    if (reducedMotion) {
      timers.push(window.setTimeout(leave, REDUCED_MOTION_HOLD_MS));
      return () => timers.forEach(window.clearTimeout);
    }
    for (let step = 1; step <= OPENING.length; step++) {
      timers.push(window.setTimeout(() => setPly(step), STEP_MS * step));
    }
    timers.push(window.setTimeout(leave, STEP_MS * OPENING.length + HOLD_MS));
    return () => timers.forEach(window.clearTimeout);
  }, [reducedMotion, leave]);

  const isPhone = viewportW < 560;
  const isShort = viewportH < 560;
  const boardWidth = fitBoard({
    viewportW,
    viewportH,
    max: isPhone ? 380 : 440,
    min: 200,
    reserveW: isPhone ? 40 : 80,
    reserveH: isShort ? 130 : 190,
  });

  return (
    <main className={"ml-stage" + (leaving ? " is-leaving" : "")} aria-label="Chess Hatch intro: a short chess opening">
      <div className="ml-inner">
        <div className="ml-brand">
          <img src="/logo-mark.png" alt="" width={30} height={30} aria-hidden="true" />
          <span>Chess Hatch</span>
        </div>

        <div className="ml-board" aria-hidden="true">
          <ChessBoard
            fen={OPENING_SEQUENCE.positions[ply]}
            theme={BOARD_THEME}
            boardWidth={boardWidth}
            arePiecesDraggable={false}
            animationDuration={reducedMotion ? 0 : 380}
          />
        </div>

        <div className="ml-caption">
          <ol className="ml-moves">
            {OPENING_SEQUENCE.sans.map((san, i) => (
              <li key={san} className={i < ply ? "is-played" : i === ply ? "is-next" : ""}>
                {i % 2 === 0 && <span className="ml-num">{i / 2 + 1}.</span>}
                <span className="ml-san">{san}</span>
              </li>
            ))}
          </ol>
        </div>

        <button type="button" className="ml-skip" onClick={leave}>
          Skip intro
        </button>
      </div>
    </main>
  );
}
