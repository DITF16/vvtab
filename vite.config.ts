import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 解决 grid-layout-plus 可能出现的 global 报错
  define: {
    global: "window",
  },
  // 确保打包后路径正确（避免空白页）
  base: "./",
});
