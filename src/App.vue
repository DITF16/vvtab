<template>
  <div
    class="wallpaper-layer"
    :style="{ backgroundImage: `url(${currentWallpaperUrl})` }"
  ></div>

  <div class="app-container" @click="closeContextMenu">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div
          v-for="(group, index) in groups"
          :key="group.id"
          class="group-icon"
          :class="{ active: currentGroupIndex === index }"
          @click="switchGroup(index)"
          @contextmenu.prevent="onSidebarRightClick(index)"
        >
          {{ group.icon }}
        </div>
        <div class="group-icon add-btn" @click="addGroup">+</div>
      </div>
      <div class="sidebar-bottom">
        <div class="setting-btn" @click="openWidgetStore">⚙️</div>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <div class="user-profile">
          <button class="icon-btn" @click="openWallpaperSettings">
            <span class="avatar">🖼️</span>
          </button>
        </div>
      </header>

      <div class="grid-wrapper" @contextmenu.prevent="openBackgroundMenu">
        <GridLayout
          v-if="groups[currentGroupIndex]"
          :key="currentGroupIndex"
          v-model:layout="currentLayout"
          :col-num="12"
          :row-height="60"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="false"
          :margin="[20, 20]"
        >
          <GridItem
            v-for="item in currentLayout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            class="grid-card-wrapper"
            @moved="handleSave"
            @resized="handleSave"
            @contextmenu.prevent.stop="openWidgetMenu($event, item)"
          >
            <component :is="getComponent(item.type)" v-bind="item" />
            <div
              v-if="!['Clock', 'Search', 'Shortcut'].includes(item.type)"
              class="fallback-card"
            >
              {{ item.title }}
            </div>
          </GridItem>
        </GridLayout>

        <div v-if="currentLayout.length === 0" class="empty-tip">
          右键点击空白处添加图标
        </div>
      </div>
    </main>

    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <template v-if="contextMenu.type === 'widget'">
        <div class="menu-header">管理组件</div>
        <div class="menu-item delete" @click="handleDeleteWidget">
          🗑️ 删除此组件
        </div>
      </template>

      <template v-else-if="contextMenu.type === 'background'">
        <div class="menu-header">页面菜单</div>
        <div class="menu-item" @click="openAddShortcutModal">➕ 添加图标</div>
        <div class="menu-item" @click="openWidgetStore">🧩 添加小组件</div>
        <div class="divider"></div>
        <div class="menu-item" @click="openWallpaperSettings">🖼️ 更换壁纸</div>
      </template>
    </div>

    <div
      v-if="showShortcutModal"
      class="modal-overlay"
      @click.self="showShortcutModal = false"
    >
      <div class="modal-content form-modal">
        <h3>添加网站图标</h3>
        <div class="form-item">
          <label>网站名称</label>
          <input
            v-model="shortcutForm.title"
            type="text"
            placeholder="例如：哔哩哔哩"
          />
        </div>
        <div class="form-item">
          <label>网站地址 (URL)</label>
          <input
            v-model="shortcutForm.url"
            type="text"
            placeholder="https://www.bilibili.com"
          />
        </div>
        <div class="form-item">
          <label>图标地址 (选填)</label>
          <input
            v-model="shortcutForm.icon"
            type="text"
            placeholder="留空则自动获取"
          />
        </div>
        <div class="form-actions">
          <button class="btn cancel" @click="showShortcutModal = false">
            取消
          </button>
          <button class="btn confirm" @click="confirmAddShortcut">
            确定添加
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showWallpaperModal"
      class="modal-overlay"
      @click.self="showWallpaperModal = false"
    >
      <div class="modal-content wallpaper-modal">
        <div class="modal-header">
          <h3>壁纸设置</h3>
          <button class="close-btn" @click="showWallpaperModal = false">
            ×
          </button>
        </div>

        <div class="wp-body">
          <div class="mode-switch">
            <button
              :class="{ active: wallpaperConfig.type === 'static' }"
              @click="changeWallpaperMode('static')"
            >
              单张模式
            </button>
            <button
              :class="{ active: wallpaperConfig.type === 'rotation' }"
              @click="changeWallpaperMode('rotation')"
            >
              轮播模式
            </button>
          </div>

          <div
            v-if="wallpaperConfig.type === 'rotation'"
            class="rotation-settings"
          >
            <label>切换间隔 (分钟): </label>
            <input
              type="number"
              v-model.number="wallpaperConfig.interval"
              min="1"
              @change="handleSave"
              class="interval-input"
            />
          </div>

          <div class="image-grid">
            <div
              v-for="(img, idx) in wallpaperConfig.images"
              :key="idx"
              class="image-item"
              :class="{
                selected:
                  wallpaperConfig.type === 'static' &&
                  wallpaperConfig.staticImage === img,
              }"
              @click="selectWallpaper(img)"
            >
              <img :src="img" loading="lazy" />
              <button class="del-img-btn" @click.stop="deleteWallpaper(idx)">
                ×
              </button>
            </div>

            <div
              class="image-item add-wp-btn"
              @click="isAddingWallpaper = true"
            >
              <span class="plus-icon">+</span>
              <span class="text">添加壁纸</span>
            </div>
          </div>

          <div v-if="isAddingWallpaper" class="add-overlay">
            <div class="overlay-header">
              <h4>添加新壁纸</h4>
              <button class="close-overlay" @click="isAddingWallpaper = false">
                取消
              </button>
            </div>

            <div class="overlay-content">
              <div class="upload-zone" @click="triggerFileUpload">
                <input
                  type="file"
                  ref="fileInputRef"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileSelect"
                />
                <span class="upload-icon">📂</span>
                <p>点击上传本地图片</p>
                <span class="sub-text">支持 JPG, PNG, WEBP (最大 3MB)</span>
              </div>

              <div class="divider-text">或者</div>

              <div class="url-zone">
                <input
                  v-model="newWallpaperUrl"
                  placeholder="输入网络图片地址 (https://...)"
                  @keydown.enter="addNewWallpaper"
                />
                <button class="confirm-btn" @click="addNewWallpaper">
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { useLayoutStorage } from "./hooks/useLayoutStorage";
import ClockWidget from "./components/widgets/ClockWidget.vue";
import SearchWidget from "./components/widgets/SearchWidget.vue";
import ShortcutWidget from "./components/widgets/ShortcutWidget.vue";

// --- 1. 引入数据存储 ---
const {
  groups,
  currentGroupIndex,
  wallpaperConfig, // 拿到壁纸配置
  switchGroup,
  loadData,
  saveData,
  addGroup,
  deleteGroup,
  moveWidgetToGroup,
  addWidgetToLayout,
} = useLayoutStorage();

// --- 2. 状态定义 ---
const showShortcutModal = ref(false);
const showWallpaperModal = ref(false); // 壁纸弹窗显隐
const isAddingWallpaper = ref(false); // 是否显示输入框区域
const newWallpaperUrl = ref(""); // 网络图片URL绑定
const fileInputRef = ref<HTMLInputElement | null>(null); // 本地文件Input的引用

// 轮播相关状态
const rotationIndex = ref(0);
let rotationTimer: any = null;

// 表单数据
const shortcutForm = reactive({ title: "", url: "", icon: "" });

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  type: "background",
  targetWidgetId: "",
});

// --- 3. 计算属性 ---

// 安全获取当前布局
const currentLayout = computed({
  get() {
    const idx = currentGroupIndex?.value ?? 0;
    return groups.value[idx]?.layout || [];
  },
  set(newLayout: any[]) {
    const idx = currentGroupIndex?.value ?? 0;
    if (groups.value[idx]) groups.value[idx].layout = newLayout;
  },
});

// 计算当前背景图（核心逻辑）
const currentWallpaperUrl = computed(() => {
  const cfg = wallpaperConfig.value;
  // 1. 如果没有图片，返回空
  if (!cfg.images || cfg.images.length === 0) return "";

  // 2. 单张模式
  if (cfg.type === "static") {
    return cfg.staticImage || cfg.images[0];
  }

  // 3. 轮播模式
  const idx = rotationIndex.value % cfg.images.length;
  return cfg.images[idx];
});

// --- 4. 生命周期与监听 ---
onMounted(() => {
  loadData();
  startRotationTimer();
});

onUnmounted(() => {
  if (rotationTimer) clearInterval(rotationTimer);
});

// 监听配置变化，重新启动定时器
watch(() => wallpaperConfig.value.type, startRotationTimer);
watch(() => wallpaperConfig.value.interval, startRotationTimer);

function startRotationTimer() {
  if (rotationTimer) clearInterval(rotationTimer);

  if (wallpaperConfig.value.type === "rotation") {
    const ms = (wallpaperConfig.value.interval || 15) * 60 * 1000;
    rotationTimer = setInterval(() => {
      rotationIndex.value++;
    }, ms);
  }
}

const handleSave = () => saveData();

// --- 5. 壁纸管理逻辑 (本次修改的核心) ---

const openWallpaperSettings = () => {
  showWallpaperModal.value = true;
  closeContextMenu();
};

const changeWallpaperMode = (mode: "static" | "rotation") => {
  wallpaperConfig.value.type = mode;
  handleSave();
};

const selectWallpaper = (url: string) => {
  if (wallpaperConfig.value.type === "static") {
    wallpaperConfig.value.staticImage = url;
    handleSave();
  }
};

const deleteWallpaper = (index: number) => {
  const deletedUrl = wallpaperConfig.value.images[index];
  wallpaperConfig.value.images.splice(index, 1);

  // 如果删掉的是当前选中的，重置选中
  if (
    wallpaperConfig.value.staticImage === deletedUrl &&
    wallpaperConfig.value.images.length > 0
  ) {
    wallpaperConfig.value.staticImage = wallpaperConfig.value.images[0] ?? "";
  }
  handleSave();
};

// 触发隐藏的文件输入框点击
const triggerFileUpload = () => {
  fileInputRef.value?.click();
};

// 处理文件选择（转 Base64）
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // 限制大小 3MB
    if (file.size > 3 * 1024 * 1024) {
      alert("图片太大啦！建议上传 3MB 以内的图片，否则浏览器会变卡哦。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      if (base64String) {
        addWallpaperToConfig(base64String);
        isAddingWallpaper.value = false;
      }
    };
    reader.readAsDataURL(file);
  }
};

// 添加网络图片
const addNewWallpaper = () => {
  if (newWallpaperUrl.value) {
    addWallpaperToConfig(newWallpaperUrl.value);
    newWallpaperUrl.value = "";
    isAddingWallpaper.value = false;
  }
};

// 统一添加逻辑 helper
const addWallpaperToConfig = (urlOrBase64: string) => {
  wallpaperConfig.value.images.push(urlOrBase64);
  // 如果是第一张，设为默认
  if (wallpaperConfig.value.images.length === 1) {
    wallpaperConfig.value.staticImage = urlOrBase64;
  }
  handleSave();
};

// --- 6. 右键菜单逻辑 ---

const openBackgroundMenu = (e: MouseEvent) => {
  contextMenu.visible = true;
  contextMenu.type = "background";
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.targetWidgetId = "";
};

const openWidgetMenu = (e: MouseEvent, item: any) => {
  contextMenu.visible = true;
  contextMenu.type = "widget";
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.targetWidgetId = item.i;
};

const closeContextMenu = () => {
  contextMenu.visible = false;
};

// --- 7. 其他功能逻辑 (快捷方式、组件等) ---

const onSidebarRightClick = (index: number) => deleteGroup(index);

const handleMoveWidget = (targetGroupIndex: number) => {
  moveWidgetToGroup(contextMenu.targetWidgetId, targetGroupIndex);
  closeContextMenu();
};

const handleDeleteWidget = () => {
  const layout = currentLayout.value;
  const idx = layout.findIndex((i: any) => i.i === contextMenu.targetWidgetId);
  if (idx > -1) {
    layout.splice(idx, 1);
    currentLayout.value = [...layout];
    handleSave();
  }
  closeContextMenu();
};

const openWidgetStore = () => addWidgetToLayout("Memo");

const openAddShortcutModal = () => {
  shortcutForm.title = "";
  shortcutForm.url = "";
  shortcutForm.icon = "";
  showShortcutModal.value = true;
  closeContextMenu();
};

const confirmAddShortcut = () => {
  if (!shortcutForm.title || !shortcutForm.url) {
    alert("请输入名称和网址");
    return;
  }
  let finalUrl = shortcutForm.url;
  if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;

  const layout = currentLayout.value;
  const yPos = layout.reduce(
    (max: number, item: any) => Math.max(max, item.y + item.h),
    0
  );

  layout.push({
    x: 0,
    y: yPos,
    w: 1,
    h: 1,
    i: `shortcut-${Date.now()}`,
    type: "Shortcut",
    title: shortcutForm.title,
    url: finalUrl,
    icon: shortcutForm.icon,
  });

  currentLayout.value = [...layout];
  handleSave();
  showShortcutModal.value = false;
};

// 组件映射
const getComponent = (type: string) => {
  switch (type) {
    case "Clock":
      return ClockWidget;
    case "Search":
      return SearchWidget;
    case "Shortcut":
      return ShortcutWidget;
    default:
      return null;
  }
};
</script>

<style scoped>
/* 基础容器 */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
/* 壁纸层：修改为 background-image */
.wallpaper-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #333; /* 兜底色 */
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease-in-out; /* 切换时的淡入淡出效果 */
  z-index: 0;
}
.sidebar {
  width: 70px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
}
.top-bar {
  height: 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 40px;
}
.icon-btn {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: 0.2s;
}
.icon-btn:hover {
  background: white;
}
.grid-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  flex: 1;
  padding-top: 20px;
  min-height: 500px;
}
.grid-card-wrapper {
  background: transparent;
}
.fallback-card {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}
:deep(.vgl-item__resizer) {
  opacity: 0;
  border: none !important;
}
.grid-card-wrapper:hover :deep(.vgl-item__resizer) {
  opacity: 1;
  background: radial-gradient(
    circle at bottom right,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 50%
  );
}
.group-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.3);
  user-select: none;
}
.group-icon.active {
  background: white;
  color: #333;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}
.group-icon:hover {
  background: rgba(255, 255, 255, 0.5);
}
.add-btn {
  border: 1px dashed rgba(255, 255, 255, 0.6);
  background: transparent;
  color: white;
  font-weight: bold;
}
.empty-tip {
  text-align: center;
  margin-top: 100px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  pointer-events: none;
}
.context-menu {
  position: fixed;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 160px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.menu-header {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.menu-item {
  padding: 10px 12px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 4px 0;
}
.menu-item.delete {
  color: #ff4d4f;
}
.form-modal {
  width: 400px;
  background: white;
  padding: 25px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-item label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}
.form-item input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #eee;
  background: #f9f9f9;
  box-sizing: border-box;
  outline: none;
  transition: 0.2s;
}
.form-item input:focus {
  border-color: #333;
  background: white;
}
.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: flex-end;
}
.btn {
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
.btn.cancel {
  background: #f5f5f5;
  color: #666;
}
.btn.confirm {
  background: #333;
  color: white;
}
.btn:hover {
  opacity: 0.9;
}
/* --- 壁纸弹窗样式优化 --- */
.wallpaper-modal {
  width: 700px; /* 稍微加宽一点 */
  height: 550px;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative; /* 为覆盖层做定位基准 */
}

.modal-header {
  padding: 15px 25px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: 0.2s;
}
.close-btn:hover {
  color: #333;
}

.wp-body {
  padding: 25px;
  flex: 1;
  overflow-y: auto;
  position: relative;
}

/* 模式切换 */
.mode-switch {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  background: #f5f5f5;
  padding: 5px;
  border-radius: 10px;
}
.mode-switch button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: #666;
  font-weight: bold;
  transition: 0.2s;
}
.mode-switch button.active {
  background: white;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.rotation-settings {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 10px;
}
.interval-input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

/* 图片网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.image-item {
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 3px solid transparent;
  background: #eee;
  transition: all 0.2s;
}
.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.image-item.selected {
  border-color: #333;
}
.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.del-img-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  opacity: 0;
  transition: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-item:hover .del-img-btn {
  opacity: 1;
}

/* 添加按钮样式 */
.add-wp-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #ddd;
  background: #fafafa;
  color: #999;
}
.add-wp-btn:hover {
  border-color: #999;
  color: #666;
  background: #f0f0f0;
}
.plus-icon {
  font-size: 32px;
  font-weight: 300;
  line-height: 1;
  margin-bottom: 5px;
}
.text {
  font-size: 12px;
}

/* === 核心优化：全屏覆盖层样式 === */
.add-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 10;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.overlay-header {
  padding: 15px 25px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.overlay-header h4 {
  margin: 0;
  font-size: 16px;
}
.close-overlay {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
}
.close-overlay:hover {
  color: #333;
  text-decoration: underline;
}

.overlay-content {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 上传大区域 */
.upload-zone {
  width: 100%;
  max-width: 400px;
  height: 180px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background: #fafafa;
  transition: 0.2s;
}
.upload-zone:hover {
  border-color: #333;
  background: #f0f0f0;
}
.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}
.upload-zone p {
  margin: 0;
  font-weight: bold;
  color: #333;
}
.sub-text {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.divider-text {
  margin: 25px 0;
  color: #ccc;
  font-size: 14px;
  position: relative;
}

/* URL 输入区域 */
.url-zone {
  width: 100%;
  max-width: 400px;
  display: flex;
  gap: 10px;
}
.url-zone input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: 0.2s;
}
.url-zone input:focus {
  border-color: #333;
}
.confirm-btn {
  background: #333;
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
.confirm-btn:hover {
  background: #555;
}
</style>
