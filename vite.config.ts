// @lovable.dev/vite-tanstack-config already includes the shared Vite/TanStack plugins.
// Keep this configuration compatible with the existing TanStack Start app.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Render runs a persistent Node.js web service, so use Nitro's Node server output
  // rather than the default Cloudflare deployment target.
  nitro: {
    preset: "node-server",
  },
  vite: {
    server: {
      allowedHosts: ["prettyhandwrittenwork.onrender.com"],
    },
    preview: {
      allowedHosts: ["prettyhandwrittenwork.onrender.com"],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
