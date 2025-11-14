import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": __dirname + "/src",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate React and ReactDOM into their own chunk
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
          
          // Separate viem (blockchain library) into its own chunk
          if (id.includes("node_modules/viem")) {
            return "viem-vendor";
          }
          
          // Separate contract ABIs (large JSON files) into their own chunk
          if (id.includes("/contracts/") && id.endsWith(".json")) {
            return "contracts";
          }
          
          // Group other node_modules into vendor chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB for better visibility
  },
});
