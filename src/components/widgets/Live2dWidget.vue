<template>
  <div
    class="live2d-wrapper"
    ref="wrapperRef"
    :style="wrapperStyle"
    @mousedown="startDrag"
  >
    <div class="controls">
      <div class="btn" @click.stop="toggleMenu" title="设置">⚙️</div>
      <div class="btn move-handle" title="拖动">✥</div>
    </div>

    <div v-if="showMenu" class="settings-panel" @mousedown.stop>
      <div class="panel-item">
        <span>缩放:</span>
        <input
          type="range"
          v-model.number="config.scale"
          min="0.1"
          max="2"
          step="0.1"
          @input="updateScale"
        />
        <span>{{ config.scale.toFixed(1) }}</span>
      </div>

      <div class="panel-item">
        <span>模型地址:</span>
        <input v-model="tempModelUrl" placeholder="输入路径或URL" />
      </div>

      <div class="panel-item btn-group">
        <button @click="changeModel" class="load-btn">加载</button>
        <button @click="fillLocalPath" class="demo-btn">填入本地示例</button>
      </div>

      <div class="panel-item">
        <button class="reset-btn" @click="resetConfig">重置位置 & 大小</button>
      </div>
    </div>

    <div v-if="message" class="bubble" :class="{ show: message }">
      {{ message }}
    </div>

    <canvas ref="canvasRef"></canvas>

    <div v-if="!modelLoaded" class="placeholder-text">Pet Loading...</div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  computed,
  onBeforeUnmount,
  watch,
} from "vue";
import { Live2DModel } from "pixi-live2d-display";

// 从 window 获取那个“打过补丁”的 PIXI
const PIXI = (window as any).PIXI;

// 注册 Ticker
try {
  Live2DModel.registerTicker(PIXI.Ticker);
} catch (e) {
  console.warn("Ticker already registered");
}

// --- 常量 ---
const STORAGE_KEY = "vvtab-live2d-config-v1";
// 确保这个路径下有文件！
const DEFAULT_MODEL = "/models/Senko_Normals/senko.model3.json";

const wrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showMenu = ref(false);
const message = ref("");
const tempModelUrl = ref("");

// ✅ 修复报错1：补充定义 modelLoaded
const modelLoaded = ref(false);

// 初始化配置
const config = reactive({
  x: window.innerWidth - 300,
  y: window.innerHeight - 400,
  width: 300,
  height: 400,
  scale: 0.5,
  modelUrl: DEFAULT_MODEL,
});

let app: any = null;
let model: any = null;

const wrapperStyle = computed(() => ({
  left: `${config.x}px`,
  top: `${config.y}px`,
  width: `${config.width}px`,
  height: `${config.height}px`,
}));

onMounted(async () => {
  loadSavedConfig();
  tempModelUrl.value = config.modelUrl;

  if (!canvasRef.value) return;

  try {
    console.log("正在初始化 Pixi...");
    // 初始化 Pixi
    app = new PIXI.Application({
      view: canvasRef.value,
      autoStart: true,
      resizeTo: wrapperRef.value,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    console.log("Pixi 初始化成功！正在加载模型...");
    await loadModel(config.modelUrl);
  } catch (e: any) {
    console.error("Pixi/Live2D 崩溃了:", e);
    // 如果仍然报 unsafe-eval，说明 main.ts 里的补丁没生效
    if (e.message && e.message.includes("unsafe-eval")) {
      message.value = "CSP Error: 补丁未生效";
    }
  }
});

onBeforeUnmount(() => {
  try {
    app?.destroy(true, { children: true, texture: true, baseTexture: true });
  } catch (e) {}
});

// --- 持久化 ---
const loadSavedConfig = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(config, parsed);
    } catch (e) {}
  } else {
    resetPosition();
  }
};

watch(
  config,
  (newVal) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
  },
  { deep: true }
);

// --- 重置位置逻辑 ---
const resetPosition = () => {
  config.x = window.innerWidth - 300;
  config.y = window.innerHeight - 400;
  if (config.x < 0) config.x = 20;
  if (config.y < 0) config.y = 20;
};

const resetConfig = () => {
  resetPosition();
  config.scale = 0.5;
  config.modelUrl = DEFAULT_MODEL;
  loadModel(DEFAULT_MODEL);
};

// --- 加载按钮逻辑 ---
const changeModel = () => {
  if (!app) {
    alert("错误：Pixi 应用没有启动成功，请查看控制台报错。");
    return;
  }
  if (tempModelUrl.value) {
    config.modelUrl = tempModelUrl.value;
    loadModel(config.modelUrl);
  } else {
    alert("请输入模型地址");
  }
};

// ✅ 修复报错2：补充定义 fillLocalPath
const fillLocalPath = () => {
  tempModelUrl.value = "/models/Senko_Normals/senko.model3.json";
  changeModel();
};

// --- 加载模型核心 ---
const loadModel = async (url: string) => {
  if (!app || !url) return;
  modelLoaded.value = false; // 开始加载

  try {
    message.value = "加载中...";
    if (model) {
      app.stage.removeChild(model);
      model.destroy();
      model = null;
    }

    model = await Live2DModel.from(url);

    model.on("error", (e: any) => console.error("Model Resource Error:", e));

    const scaleX = (wrapperRef.value!.offsetWidth * config.scale) / model.width;
    const scaleY =
      (wrapperRef.value!.offsetHeight * config.scale) / model.height;
    model.scale.set(Math.min(scaleX, scaleY) * 0.8);

    model.x = (wrapperRef.value!.offsetWidth - model.width) / 2;
    model.y = (wrapperRef.value!.offsetHeight - model.height) / 2;

    model.on("hit", (hitAreas: string[]) => {
      if (hitAreas.includes("body")) model?.motion("tap_body");
      if (hitAreas.includes("head")) model?.expression("happy");
    });

    app.stage.addChild(model);
    message.value = "";
    modelLoaded.value = true; // 加载成功
  } catch (e: any) {
    console.error("模型加载失败:", e);
    message.value = "加载失败";
    if (e.message.includes("unsafe-eval")) {
      alert(
        "严重错误：Chrome 安全策略拦截了 Live2D。\n请检查 main.ts 和 vite.config.ts"
      );
    } else {
      // alert(`模型加载失败：\n${url}\n请按F12检查 Network 是否 404`);
    }
  }
};

// --- 交互 ---
const toggleMenu = () => (showMenu.value = !showMenu.value);
const updateScale = () => {
  if (model) {
    model.scale.set(config.scale * 0.5);
  }
};

// 拖拽
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialLeft = 0;
let initialTop = 0;

const startDrag = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest(".settings-panel")) return;
  e.preventDefault();
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  initialLeft = config.x;
  initialTop = config.y;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
};
const onDrag = (e: MouseEvent) => {
  if (!isDragging) return;
  config.x = initialLeft + (e.clientX - dragStartX);
  config.y = initialTop + (e.clientY - dragStartY);
};
const stopDrag = () => {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
};
</script>

<style scoped>
.live2d-wrapper {
  position: fixed;
  z-index: 9999;
  user-select: none;
  pointer-events: auto;
  border: 2px dashed rgba(200, 200, 200, 0.3);
  border-radius: 8px;
  transition: border-color 0.3s;
}
.live2d-wrapper:hover {
  border-color: rgba(200, 200, 200, 0.8);
}
.placeholder-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
  pointer-events: none;
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.controls {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
}
.live2d-wrapper:hover .controls {
  opacity: 1;
}
.btn {
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  font-size: 14px;
}
.btn:hover {
  background: #f0f0f0;
}
.move-handle {
  cursor: grab;
}
.move-handle:active {
  cursor: grabbing;
}
.settings-panel {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 240px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 10px;
  color: #333;
}
.panel-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.panel-item input[type="text"] {
  flex: 1;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.panel-item button {
  background: #333;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.reset-btn {
  width: 100%;
  background: #ff4d4f;
}
.bubble {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-size: 13px;
  color: #333;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  margin-top: -10px;
  white-space: nowrap;
}
.bubble.show {
  opacity: 1;
}
.btn-group {
  display: flex;
  gap: 5px;
}
.load-btn {
  flex: 1;
  background: #333;
  color: white;
}
.demo-btn {
  flex: 1;
  background: #1890ff;
  color: white;
  font-size: 12px;
}
</style>
