import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 }, // host:true so it's reachable on your phone over LAN for mobile testing
});
