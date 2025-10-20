import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    allowedHosts: ["3000-irzmo3yjgfx1po5udv20f-8fe309e2.manusvm.computer"],
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
});
