// Light and dark theme tokens.
//
// The app already routes every surface colour through six tokens
// (pageBg, panelBg, textMain, textMuted, borderCol, accentGold) that
// App.jsx hands down to every screen as props, so switching themes is
// just a question of feeding those six names a different palette. Nothing
// else in the app needs to know a theme even exists.
//
// The dark palette is deliberately not a neutral near-black. It is a warm
// charcoal with a faint plum/terracotta undertone, so it reads as the
// same brand as the cream light theme (which is the same hue family,
// bathed dark) rather than as a default "dark mode" preset. The accent
// is lifted a touch so it keeps its contrast against dark surfaces.
import { useState, useCallback, useEffect, useRef } from "react";

export const THEME_TOKENS = {
  light: {
    pageBg: "#FFF8EF",
    panelBg: "#FFFFFF",
    textMain: "#2B2620",
    textMuted: "#6B6355",
    borderCol: "#ECE4D6",
    accentGold: "#E2694B",
  },
  dark: {
    pageBg: "#17110D",
    panelBg: "#231A15",
    textMain: "#F5EDE4",
    textMuted: "#B4A595",
    borderCol: "#3B2C23",
    accentGold: "#F07C5C",
  },
};

// The theme is picked once per browser. An explicit choice wins; with no
// choice recorded we fall back to the operating system's preference, so
// a first visit already feels right.
export const THEME_KEY = "chesshatch_theme";
const LEGACY_THEME_KEY = "chessloop_theme";

function systemPrefersDark() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage can throw in private browsing; fall through to the OS.
  }
  return systemPrefersDark() ? "dark" : "light";
}

// Paints a theme onto the document without persisting it. Split out so
// index.html can run the exact same logic before React mounts (no flash
// of the wrong theme on reload) and so the hook can reuse it.
export function applyTheme(mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  const bg = THEME_TOKENS[mode]?.pageBg;
  // Both the direct background and the CSS custom property: html/body read
  // the property (index.html's inline style), so they stay in step.
  if (bg) { root.style.backgroundColor = bg; root.style.setProperty("--ch-bg", bg); }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", bg);
}

export function useThemeMode() {
  const [mode, setModeState] = useState(() => readStoredTheme());

  // Keep the document in step with the state, including the very first
  // render, so the palette and the CSS-scoped nav rules never disagree
  // with the tokens App.jsx is passing down.
  useEffect(() => { applyTheme(mode); }, [mode]);

  const setMode = useCallback((next) => {
    const value = next === "dark" ? "dark" : "light";
    setModeState(value);
    try { localStorage.setItem(THEME_KEY, value); } catch { /* choice just won't persist */ }
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const value = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, value); } catch { /* choice just won't persist */ }
      return value;
    });
  }, []);

  return { mode, setMode, toggle };
}

// Cross-fades the whole page while a theme change is in flight. A short
// class on <html> turns on transitions for the tokens that actually
// change, then is removed so it can never interfere with the app's own
// animations (board pieces, check/mate pulses, the motion intro).
export function useThemedTransition(mode) {
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (typeof document === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("ch-theming");
    const done = window.setTimeout(() => root.classList.remove("ch-theming"), 720);
    return () => { window.clearTimeout(done); root.classList.remove("ch-theming"); };
  }, [mode]);
}

