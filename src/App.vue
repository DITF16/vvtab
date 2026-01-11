<template>
  <div class="wallpaper-layer"></div>

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
          :title="group.name + ' (右键删除)'"
        >
          {{ group.icon }}
        </div>
        <div class="group-icon add-btn" @click="addGroup">+</div>
      </div>
      <div class="sidebar-bottom">
        <div class="setting-btn">⚙️</div>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <div class="user-profile">
          <button class="icon-btn">
            <span class="avatar">👤</span>
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
        <div class="menu-header">移动组件到...</div>
        <div
          v-for="(group, index) in groups"
          :key="group.id"
          class="menu-item"
          v-show="index !== currentGroupIndex"
          @click="handleMoveWidget(index)"
        >
          <span>{{ group.icon }} {{ group.name }}</span>
        </div>

        <div class="divider"></div>
        <div class="menu-item delete" @click="handleDeleteWidget">
          🗑️ 删除此组件
        </div>
      </template>

      <template v-else-if="contextMenu.type === 'background'">
        <div class="menu-header">页面菜单</div>
        <div class="menu-item" @click="openAddShortcutModal">➕ 添加图标</div>
        <div class="menu-item" @click="openWidgetStore">🧩 添加小组件</div>
        <div class="divider"></div>
        <div class="menu-item">🖼️ 更换壁纸</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { useLayoutStorage } from "./hooks/useLayoutStorage";
import ClockWidget from "./components/widgets/ClockWidget.vue";
import SearchWidget from "./components/widgets/SearchWidget.vue";
import ShortcutWidget from "./components/widgets/ShortcutWidget.vue";

const {
  groups,
  currentGroupIndex,
  switchGroup,
  loadData,
  saveData,
  addGroup,
  deleteGroup,
  moveWidgetToGroup, // 确保从 hook 引入了这个方法
} = useLayoutStorage();

const showShortcutModal = ref(false);

const shortcutForm = reactive({
  title: "",
  url: "",
  icon: "",
});

const currentLayout = computed({
  get() {
    const idx = currentGroupIndex?.value ?? 0;
    const g = groups?.value?.[idx];
    return g ? g.layout : [];
  },
  set(newLayout: any[]) {
    const idx = currentGroupIndex?.value ?? 0;
    if (groups?.value?.[idx]) {
      groups.value[idx].layout = newLayout;
    }
  },
});

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  type: "background",
  targetWidgetId: "",
});

onMounted(() => {
  loadData();
});

const handleSave = () => saveData();

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

// --- 右键菜单逻辑 ---

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

// --- 功能逻辑 ---

const onSidebarRightClick = (index: number) => deleteGroup(index);

// 修复：添加回移动组件的处理函数
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
    saveData();
  }
  closeContextMenu();
};

const openWidgetStore = () => {
  alert("这里弹出组件中心");
  closeContextMenu();
};

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
  if (!finalUrl.startsWith("http")) {
    finalUrl = "https://" + finalUrl;
  }

  const layout = currentLayout.value;
  const yPos = layout.reduce(
    (max: number, item: any) => Math.max(max, item.y + item.h),
    0
  );

  const newWidget = {
    x: 0,
    y: yPos,
    w: 1,
    h: 1,
    i: `shortcut-${Date.now()}`,
    type: "Shortcut",
    title: shortcutForm.title,
    url: finalUrl,
    icon: shortcutForm.icon,
  };

  layout.push(newWidget);
  currentLayout.value = [...layout];
  saveData();

  showShortcutModal.value = false;
};
</script>

<style scoped>
/* 样式保持不变，直接复用你提供的即可 */
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
  background: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
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
.form-modal h3 {
  margin: 0 0 10px 0;
  color: #333;
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
</style>
