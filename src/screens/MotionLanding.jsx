// The motion landing page: the first thing a visitor sees at "/".
//
// It is deliberately outside the app shell (see src/main.jsx), so the
// existing Chess Hatch screens, nav and styling are untouched. Entering
// the site from here navigates to "/home", which is where the original
// home screen now lives, so the landing page is never re-entered by an
// in-app Home button.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./motionLanding.css";

const VIDEO_SRC = "/chess-motion-landing.mp4";
const POSTER_SRC = "/chess-motion-poster.jpg";
const HOME_PATH = "/home";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
const DESCRIPTION =
  "Learn chess from your first move to real tactics, at your own pace.";

/* The reference card carries three entries and highlights the middle
   one; each one now leads into the real site rather than nowhere. */
const MENU_ITEMS = [
  { key: "home", label: "Home", to: HOME_PATH },
  { key: "play", label: "Play a Game", to: "/play", featured: true },
  { key: "dashboard", label: "Dashboard", to: "/lessons" },
];

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

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.3 2.7a1 1 0 0 1 1.4 0l8.5 7.8a1 1 0 0 1-1.4 1.5l-.8-.8v8.6a2 2 0 0 1-2 2h-3.6v-6.3h-4.8v6.3H5a2 2 0 0 1-2-2v-8.6l-.8.8a1 1 0 0 1-1.4-1.5z" />
    </svg>
  );
}

function PawnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="6.6" r="3.6" />
      <path d="M9.3 11.6h5.4l-1.1 4.9H10.4z" />
      <path d="M7.3 17.2h9.4a1.1 1.1 0 0 1 1.1 1.1v1.5a1.1 1.1 0 0 1-1.1 1.1H7.3a1.1 1.1 0 0 1-1.1-1.1v-1.5a1.1 1.1 0 0 1 1.1-1.1z" />
    </svg>
  );
}

function BarsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2.6" y="14.6" width="3.4" height="6" rx="1.1" />
      <rect x="7.5" y="11.6" width="3.4" height="9" rx="1.1" />
      <rect x="12.4" y="8.6" width="3.4" height="12" rx="1.1" />
      <rect x="17.3" y="4.6" width="3.4" height="16" rx="1.1" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="ml-chev"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export default function MotionLanding() {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Page-level metadata for the one screen that lives outside App.jsx,
  // plus a dark body/theme color so no cream page background peeks out
  // behind or below the footage. All of it is undone on the way out.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Chess Hatch";

    const descTag = document.querySelector('meta[name="description"]');
    const prevDesc = descTag ? descTag.getAttribute("content") : null;
    if (descTag) descTag.setAttribute("content", DESCRIPTION);

    const themeTag = document.querySelector('meta[name="theme-color"]');
    const prevTheme = themeTag ? themeTag.getAttribute("content") : null;
    if (themeTag) themeTag.setAttribute("content", "#0B0A0A");

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = FONT_HREF;
    document.head.appendChild(fontLink);

    document.body.classList.add("ml-body");

    return () => {
      document.title = previousTitle;
      if (descTag && prevDesc !== null) descTag.setAttribute("content", prevDesc);
      if (themeTag && prevTheme !== null) themeTag.setAttribute("content", prevTheme);
      if (fontLink.parentNode) fontLink.parentNode.removeChild(fontLink);
      document.body.classList.remove("ml-body");
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    // Restore the source if a previous cleanup detached it. React
    // StrictMode mounts, cleans up and remounts every effect in
    // development, and the cleanup below deliberately drops the source,
    // so without this the clip would silently never load.
    if (video.getAttribute("src") !== VIDEO_SRC) video.setAttribute("src", VIDEO_SRC);
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
  }, [reducedMotion]);

  // Autoplay can be refused (strict power-saving modes, some in-app
  // browsers). The poster stays on screen and the landing page keeps
  // working; the first tap or key press gives playback another chance.
  useEffect(() => {
    if (reducedMotion || playing) return;
    const retry = () => {
      const video = videoRef.current;
      if (!video) return;
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
    };
    window.addEventListener("pointerdown", retry, { once: true });
    window.addEventListener("touchstart", retry, { once: true });
    window.addEventListener("keydown", retry, { once: true });
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("keydown", retry);
    };
  }, [reducedMotion, playing]);

  // Leaving for the main site unmounts this screen; pause and drop the
  // source explicitly so the clip never keeps playing or holding its
  // decoder and buffers behind the app.
  useEffect(
    () => () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        /* nothing to clean up if the element is already gone */
      }
    },
    []
  );

  return (
    <main className="ml-stage">
      <div className="ml-media-layer">
        <img
          className="ml-media ml-poster"
          src={POSTER_SRC}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchpriority="high"
        />
        {!reducedMotion && (
          <video
            ref={videoRef}
            className={"ml-media" + (playing ? " is-ready" : "")}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            onPlaying={() => setPlaying(true)}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
      </div>

      <div className="ml-ui">
        <nav className="ml-menu" aria-label="Enter Chess Hatch">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={"ml-item" + (item.featured ? " is-featured" : "")}
            >
              {item.key === "home" && <HomeIcon />}
              {item.key === "play" && <PawnIcon />}
              {item.key === "dashboard" && <BarsIcon />}
              <span>{item.label}</span>
              <ChevronIcon />
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
