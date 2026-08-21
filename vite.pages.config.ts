import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * A separate static build for GitHub Pages. The authenticated production app
 * continues to use vite.config.ts and the managed server/database stack.
 */
export default defineConfig({
  base: process.env.PAGES_BASE_PATH ?? "/",
  plugins: [react()],
  root: path.resolve(import.meta.dirname, "recruiter-demo"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-pages"),
    emptyOutDir: true,
  },
});
