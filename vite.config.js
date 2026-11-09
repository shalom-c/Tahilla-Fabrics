import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Firestore is a lazy standalone vendor chunk, 696 kB raw and 182 kB gzip.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            /node_modules\/(react|react-dom|scheduler)\//.test(id)
          ) {
            return "react-vendor";
          }
          if (/node_modules\/firebase\/(auth|firestore|app)\//.test(id)) {
            const service = id.match(/node_modules\/firebase\/(auth|firestore|app)\//)?.[1];
            return `firebase-${service}`;
          }
          if (/node_modules\/@firebase\/(auth|firestore|app|storage)\//.test(id)) {
            const service = id.match(/node_modules\/@firebase\/(auth|firestore|app|storage)\//)?.[1];
            return `firebase-${service}`;
          }
          return undefined;
        },
      },
    },
  },
});
