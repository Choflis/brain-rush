import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: { input: {
      principal: fileURLToPath(new URL("./index.html", import.meta.url)),
      tiendita: fileURLToPath(new URL("./tiendita.html", import.meta.url)),
    } },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
