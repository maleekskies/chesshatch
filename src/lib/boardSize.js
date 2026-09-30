// Shared board sizing.
//
// Every board in the app used to be sized from window.innerWidth alone
// (see the history of Play.jsx, GuidedGame.jsx, and friends). On a
// laptop that leaves the board taller than the room the page actually
// has: at 1280x720 the 560px Play board plus the nav, the status row
// and the page padding add up past the bottom of the window, so the
// board runs off the screen and the page looks zoomed in.
//
// These two helpers fix that at the source: a board is fitted to
// whichever of (width, height) is tighter, after subtracting the space
// the surrounding chrome realistically needs. Big screens are
// unaffected, because `max` still caps the board at its designed size;
// only viewports that genuinely don't fit get shrunk.
import { useEffect, useState } from "react";

function readViewport() {
  if (typeof window === "undefined") return { width: 1200, height: 800 };
  return { width: window.innerWidth || 1200, height: window.innerHeight || 800 };
}

// Reactive viewport size, so a resize/orientation change re-renders the
// screen and the board re-fits. The screens previously read
// window.innerWidth during render, which meant a desktop window that
// was resized (or a phone rotated) kept an oversized board until the
// next unrelated re-render.
export function useViewport() {
  const [size, setSize] = useState(readViewport);
  useEffect(() => {
    function onResize() { setSize(readViewport()); }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return size;
}

// Fit a square board into the space actually left for it.
//   max      - the board's designed maximum size at this breakpoint
//   reserveW - horizontal room the rest of the row needs (gaps, side panel)
//   reserveH - vertical room the page chrome needs (nav, padding, controls)
// `min` matches ChessBoard's own floor, so a board never collapses to
// nothing on a very small screen; ChessBoard clamps to the same value.
export function fitBoard({ viewportW, viewportH, max, min = 200, reserveW = 0, reserveH = 0 }) {
  const available = Math.min(viewportW - reserveW, viewportH - reserveH, max);
  return Math.max(min, Math.round(available));
}
