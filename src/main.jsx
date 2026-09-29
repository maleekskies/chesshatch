import "./lib/migrateStorage.js"; // must run before anything reads the renamed keys below
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// A blank white page with no error message is the hardest kind of bug
// to debug from a deployed site. This catches any render-time crash and
// shows something visible instead, with the actual error message.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "monospace", color: "#2B2620", background: "#FFF8EF", minHeight: "100vh" }}>
          <h2 style={{ color: "#E05B5B" }}>Chess Hatch crashed on load</h2>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <p style={{ color: "#8791A1", fontSize: 13, marginTop: 16 }}>
            Check the browser console (F12) for the full stack trace. If this
            mentions Supabase, check that VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY are set as environment variables on your
            hosting platform.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register the service worker after the page has finished loading, so
// it never competes with the initial render for bandwidth/CPU. Wrapped
// in a feature check + catch since some browsers (and all non-HTTPS
// dev contexts other than localhost) don't support it.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* offline support just won't be available */ });
  });
}
