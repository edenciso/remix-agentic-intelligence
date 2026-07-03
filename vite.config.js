import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config. The React plugin handles JSX + fast refresh.
// `outDir: dist` matches the Cloudflare Pages default build output.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    // Reduce chunk-size warning noise — RemixStudio.jsx is ~2.4k lines
    // and bundles to one large chunk, which is fine for this app shape.
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
