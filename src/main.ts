import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

// -------------------------------------------------------------
// ✅ 终极修复方案：手动注入 unsafe-eval 补丁
// -------------------------------------------------------------

import * as PIXI from "pixi.js";

// 1. 引入 install 方法 (注意：这里不再只是 import 副作用)
import { install } from "@pixi/unsafe-eval";

// 2. 手动执行修补！
// 这行代码会强制替换 PIXI 内部的 Shader 生成逻辑，绕过 Chrome 安全检查
install(PIXI);

// 3. 挂载到全局 (给 Live2D 插件用)
(window as any).PIXI = PIXI;

// -------------------------------------------------------------

const app = createApp(App);
app.mount("#app");
