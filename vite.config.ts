import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Dev/preview proxy — browsers can't hit Yahoo Finance directly (CORS). */
const yahooProxy: Record<string, ProxyOptions> = {
  "/api/yahoo": {
    target: "https://query1.finance.yahoo.com",
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api\/yahoo/, ""),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
    },
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: yahooProxy,
  },
  preview: {
    host: true,
    proxy: yahooProxy,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
