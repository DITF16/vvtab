import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // ✅✅✅ 核心修复：强制 Vite 只打包一个版本的 pixi.js
    dedupe: ["pixi.js"],

    alias: {
      "@": path.resolve(__dirname, "src"),
      // 再次加固：确保所有 import 都指向 node_modules 根目录下的 pixi
      "pixi.js": path.resolve(__dirname, "node_modules/pixi.js"),
    },
  },
  build: {
    // 消除打包大小警告 (可选)
    chunkSizeWarningLimit: 1500,
  },
});
