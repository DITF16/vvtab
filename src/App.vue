<template>
  <div
    class="wallpaper-layer"
    :style="{ backgroundImage: `url(${currentWallpaperUrl})` }"
  ></div>

  <div class="app-container">
    <router-view />

    <Live2dWidget />
  </div>

  <div class="app-container" @click="closeContextMenu">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div
          v-for="(group, index) in groups"
          :key="group.id"
          class="group-icon"
          :class="{ active: currentGroupIndex === index }"
          @click="switchGroup(index)"
          @contextmenu.prevent.stop="openSidebarMenu($event, index)"
          :title="group.name"
        >
          {{ group.icon }}
        </div>
        <div class="group-icon add-btn" @click="openAddGroupModal">+</div>
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

      <template v-else-if="contextMenu.type === 'sidebar'">
        <div class="menu-header">分组管理</div>
        <div class="menu-item" @click="openEditGroupModal">✏️ 编辑分组</div>
        <div class="divider"></div>
        <div class="menu-item delete" @click="handleDeleteGroup">
          🗑️ 删除分组
        </div>
      </template>
    </div>

    <div
      v-if="showGroupModal"
      class="modal-overlay"
      @click.self="showGroupModal = false"
    >
      <div class="modal-content form-modal group-modal">
        <h3>{{ isEditingGroup ? "编辑分组" : "新建分组" }}</h3>

        <div class="form-item">
          <label>分组名称</label>
          <input
            v-model="groupForm.name"
            type="text"
            placeholder="例如：娱乐、工作..."
            maxlength="6"
          />
        </div>

        <div class="form-item">
          <label>选择图标</label>
          <div class="icon-selector">
            <div
              v-for="icon in GROUP_ICONS"
              :key="icon"
              class="icon-option"
              :class="{ active: groupForm.icon === icon }"
              @click="groupForm.icon = icon"
            >
              {{ icon }}
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn cancel" @click="showGroupModal = false">
            取消
          </button>
          <button class="btn confirm" @click="confirmSaveGroup">保存</button>
        </div>
      </div>
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
              class="image-item add-wp"
              @click="isAddingWallpaper = true"
              v-if="!isAddingWallpaper"
            >
              <span class="plus-icon">+</span><span class="text">添加壁纸</span>
            </div>
            <div v-if="isAddingWallpaper" class="add-overlay">
              <div class="overlay-header">
                <h4>添加新壁纸</h4>
                <button
                  class="close-overlay"
                  @click="isAddingWallpaper = false"
                >
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
                </div>
                <div class="divider-text">或者</div>
                <div class="url-zone">
                  <input
                    v-model="newWallpaperUrl"
                    placeholder="输入网络图片地址"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { useLayoutStorage } from "./hooks/useLayoutStorage";
import ClockWidget from "./components/widgets/ClockWidget.vue";
import SearchWidget from "./components/widgets/SearchWidget.vue";
import ShortcutWidget from "./components/widgets/ShortcutWidget.vue";
import Live2dWidget from "./components/widgets/Live2dWidget.vue";

// --- 常用图标库 (30个) ---
const GROUP_ICONS = [
  "🏠",
  "💼",
  "🎮",
  "❤️",
  "⭐",
  "🔥",
  "🚀",
  "💡",
  "📝",
  "📷",
  "🎵",
  "🎨",
  "⚽",
  "🏀",
  "🍔",
  "☕",
  "🍺",
  "✈️",
  "🚗",
  "🚲",
  "💻",
  "📱",
  "📚",
  "🎓",
  "💰",
  "🎁",
  "🎉",
  "📅",
  "⚙️",
  "🔍",
];

const {
  groups,
  currentGroupIndex,
  wallpaperConfig,
  switchGroup,
  loadData,
  saveData,
  addGroup,
  updateGroup, // 引入更新方法
  deleteGroup,
  moveWidgetToGroup,
  addWidgetToLayout,
} = useLayoutStorage();

// --- 状态 ---
const showShortcutModal = ref(false);
const showWallpaperModal = ref(false);
const showGroupModal = ref(false); // 分组弹窗
const isEditingGroup = ref(false); // 是否是编辑模式
const editingGroupIndex = ref(-1); // 当前正在编辑/操作的分组索引

const isAddingWallpaper = ref(false);
const newWallpaperUrl = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);

const rotationIndex = ref(0);
let rotationTimer: any = null;

// 表单数据
const shortcutForm = reactive({ title: "", url: "", icon: "" });
const groupForm = reactive({ name: "", icon: "🏠" }); // 分组表单

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  type: "background", // 'widget' | 'background' | 'sidebar'
  targetWidgetId: "",
  targetGroupIndex: -1, // 记录右键点击的是哪个分组
});

// --- 计算属性 ---
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

const currentWallpaperUrl = computed(() => {
  const cfg = wallpaperConfig.value;
  if (!cfg.images || cfg.images.length === 0) return "";
  if (cfg.type === "static") return cfg.staticImage || cfg.images[0];
  const idx = rotationIndex.value % cfg.images.length;
  return cfg.images[idx];
});

// --- 生命周期 ---
onMounted(() => {
  loadData();
  startRotationTimer();
});
onUnmounted(() => {
  if (rotationTimer) clearInterval(rotationTimer);
});
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

// --- 分组管理逻辑 (核心新增) ---

// 1. 打开添加弹窗
const openAddGroupModal = () => {
  isEditingGroup.value = false;
  groupForm.name = "";
  // GROUP_ICONS[0] may be undefined if the array is empty — provide a fallback to satisfy TS
  groupForm.icon = GROUP_ICONS[0] ?? "🏠";
  showGroupModal.value = true;
};

// 2. 打开编辑弹窗
const openEditGroupModal = () => {
  const index = contextMenu.targetGroupIndex;
  const group = groups.value[index];
  if (!group) return;

  isEditingGroup.value = true;
  editingGroupIndex.value = index;
  // 回填数据
  groupForm.name = group.name;
  groupForm.icon = group.icon;

  showGroupModal.value = true;
  closeContextMenu();
};

// 3. 确认保存分组
const confirmSaveGroup = () => {
  if (!groupForm.name) {
    alert("请输入分组名称");
    return;
  }

  if (isEditingGroup.value) {
    // 更新
    updateGroup(editingGroupIndex.value, groupForm.name, groupForm.icon);
  } else {
    // 新增
    addGroup(groupForm.name, groupForm.icon);
  }
  showGroupModal.value = false;
};

// 4. 删除分组
const handleDeleteGroup = () => {
  const index = contextMenu.targetGroupIndex;
  // 防护：groups.value[index] 可能为 undefined
  const name = groups.value[index]?.name ?? "";
  if (confirm(`确定要删除分组“${name}”吗？\n该操作无法撤销。`)) {
    deleteGroup(index);
  }
  closeContextMenu();
};

// --- 右键菜单逻辑 ---

const openBackgroundMenu = (e: MouseEvent) => {
  contextMenu.visible = true;
  contextMenu.type = "background";
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
};

const openWidgetMenu = (e: MouseEvent, item: any) => {
  contextMenu.visible = true;
  contextMenu.type = "widget";
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.targetWidgetId = item.i;
};

// 新增：侧边栏右键菜单
const openSidebarMenu = (e: MouseEvent, index: number) => {
  contextMenu.visible = true;
  contextMenu.type = "sidebar";
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.targetGroupIndex = index;
};

const closeContextMenu = () => {
  contextMenu.visible = false;
};

// --- 其他逻辑 ---
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

// 简化的逻辑引用...
const openWidgetStore = () => addWidgetToLayout("Memo");
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
  if (
    wallpaperConfig.value.staticImage === deletedUrl &&
    wallpaperConfig.value.images.length > 0
  )
    // images[0] may be undefined in TS narrowing; provide a safe fallback
    wallpaperConfig.value.staticImage = wallpaperConfig.value.images[0] ?? "";
  handleSave();
};
const triggerFileUpload = () => {
  fileInputRef.value?.click();
};
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 3 * 1024 * 1024)
      return alert("图片太大啦！建议上传 3MB 以内的图片");
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        addNewWallpaperHelper(base64);
        isAddingWallpaper.value = false;
      }
    };
    reader.readAsDataURL(file);
  }
};
const addNewWallpaper = () => {
  if (newWallpaperUrl.value) {
    addNewWallpaperHelper(newWallpaperUrl.value);
    newWallpaperUrl.value = "";
    isAddingWallpaper.value = false;
  }
};
const addNewWallpaperHelper = (url: string) => {
  wallpaperConfig.value.images.push(url);
  if (wallpaperConfig.value.images.length === 1)
    wallpaperConfig.value.staticImage = url;
  handleSave();
};

const openAddShortcutModal = () => {
  shortcutForm.title = "";
  shortcutForm.url = "";
  shortcutForm.icon = "";
  showShortcutModal.value = true;
  closeContextMenu();
};
const confirmAddShortcut = () => {
  if (!shortcutForm.title || !shortcutForm.url)
    return alert("请输入名称和网址");
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
/* 保持原有基础样式不变，仅补充新增样式 */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.wallpaper-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #333;
  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease-in-out;
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

/* --- 分组弹窗特有样式 --- */
.group-modal {
  width: 450px;
}
.icon-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 5px;
  border: 1px solid #eee;
  border-radius: 8px;
}
.icon-option {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  cursor: pointer;
  border-radius: 6px;
  transition: 0.2s;
}
.icon-option:hover {
  background: #f0f0f0;
}
.icon-option.active {
  background: #333;
  color: white;
}

/* 壁纸弹窗 (复用) */
.wallpaper-modal {
  width: 700px;
  height: 550px;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
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
}
.wp-body {
  padding: 25px;
  flex: 1;
  overflow-y: auto;
  position: relative;
}
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
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-item:hover .del-img-btn {
  opacity: 1;
}
.add-wp {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #ddd;
  background: #fafafa;
  color: #999;
  cursor: pointer;
}
.add-wp:hover {
  border-color: #999;
  color: #666;
}
.plus-icon {
  font-size: 32px;
  line-height: 1;
  margin-bottom: 5px;
}
.text {
  font-size: 12px;
}

/* 覆盖层 */
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
}
.overlay-content {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
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
}
.upload-zone:hover {
  border-color: #333;
  background: #f0f0f0;
}
.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}
.divider-text {
  margin: 25px 0;
  color: #ccc;
  font-size: 14px;
}
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
</style>
