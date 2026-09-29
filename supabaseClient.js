import { createClient } from "@supabase/supabase-js";

// Get these from your Supabase project: Settings -> API
// Locally these come from .env.local. On Vercel/Netlify, .env.local is
// NOT deployed (it's gitignored on purpose, so real keys never hit a
// public repo), you must add these two as environment variables in
// your hosting platform's dashboard, then redeploy.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw here, throwing at module load crashes the entire app
  // before React even renders, which shows up as a blank white page
  // with no clue why. Warn instead, and let the app render; auth/save
  // features just won't work until the env vars are set.
  console.warn(
    "[Chess Hatch] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Sign-in and saving results won't work until these are set " +
    "(locally in .env.local, or as environment variables in your " +
    "hosting platform's dashboard for a deployed site)."
  );
}

// Fall back to placeholder values so createClient doesn't throw.
// calls will fail gracefully instead of crashing the app on load.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
