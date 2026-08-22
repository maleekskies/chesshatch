import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

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
        <div style={{ padding: 24, fontFamily: "monospace", color: "#EDE6D6", background: "#1B2430", minHeight: "100vh" }}>
          <h2 style={{ color: "#E05B5B" }}>ChessPath crashed on load</h2>
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
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
