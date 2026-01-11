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

        <div class="group-icon add-btn" @click="addGroup" title="新建分组">
          +
        </div>
      </div>

      <div class="sidebar-bottom">
        <div class="setting-btn">⚙️</div>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <div class="user-profile">
          <button class="icon-btn" @click="openSettings">
            <span class="avatar">👤</span>
          </button>
        </div>
      </header>

      <div class="grid-wrapper">
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
            <component :is="getComponent(item.type)" />

            <div
              v-if="!['Clock', 'Search'].includes(item.type)"
              class="fallback-card"
            >
              {{ item.title }}
            </div>
          </GridItem>
        </GridLayout>

        <div v-if="currentLayout.length === 0" class="empty-tip">
          当前分组为空，快去添加组件吧
        </div>
      </div>
    </main>

    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
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
        🗑️ 删除组件
      </div>
    </div>

    <div
      v-if="showSettings"
      class="modal-overlay"
      @click.self="showSettings = false"
    >
      <div class="modal-content">
        <h2>设置中心</h2>
        <button @click="showSettings = false">关闭</button>
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

const {
  groups,
  currentGroupIndex,
  switchGroup,
  loadData,
  saveData,
  addGroup,
  deleteGroup,
  moveWidgetToGroup,
} = useLayoutStorage();
const showSettings = ref(false);

// 可读写 computed，安全绑定 layout，避免对象可能为 undefined 的错误
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

// 右键菜单状态管理
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  targetWidgetId: "", // 记录当前右键点击的是哪个组件
});

onMounted(() => {
  // chrome.storage.local.clear(); // 首次运行时解开注释清理旧数据
  loadData();
});

const handleSave = () => saveData();
const openSettings = () => (showSettings.value = true);

// 获取组件类型
const getComponent = (type: string) => {
  switch (type) {
    case "Clock":
      return ClockWidget;
    case "Search":
      return SearchWidget;
    default:
      return null;
  }
};

// --- 交互逻辑 ---

// 1. 侧边栏右键删除
const onSidebarRightClick = (index: number) => {
  deleteGroup(index);
};

// 2. 打开组件右键菜单
const openWidgetMenu = (e: MouseEvent, item: any) => {
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.targetWidgetId = item.i;
};

// 3. 关闭右键菜单
const closeContextMenu = () => {
  contextMenu.visible = false;
};

// 4. 执行移动操作
const handleMoveWidget = (targetGroupIndex: number) => {
  moveWidgetToGroup(contextMenu.targetWidgetId, targetGroupIndex);
  closeContextMenu();
};

// 5. 执行删除组件操作 (使用 currentLayout 安全修改)
const handleDeleteWidget = () => {
  const layout = currentLayout.value;
  const idx = layout.findIndex((i: any) => i.i === contextMenu.targetWidgetId);
  if (idx > -1) {
    // 直接修改数组（如果绑定的是原数组，会同步到 groups）
    layout.splice(idx, 1);
    // 触发 setter 以确保响应性（如果需要则重新赋值）
    currentLayout.value = [...layout];
    saveData();
  }
  closeContextMenu();
};
</script>

<style scoped>
/* --- 保持原有的基础样式 (这里省略重复部分，只列出修改和新增的) --- */
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
.modal-content {
  background: white;
  width: 600px;
  height: 400px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  text-align: center;
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

/* --- 新增样式：侧边栏图标 --- */
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

/* 加号按钮样式 */
.add-btn {
  border: 1px dashed rgba(255, 255, 255, 0.6);
  background: transparent;
  color: white;
  font-weight: bold;
}

/* 空状态提示 */
.empty-tip {
  text-align: center;
  margin-top: 100px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
}

/* --- 新增样式：右键菜单 (Context Menu) --- */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 160px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fadeIn 0.1s ease-out;
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
  transition: background 0.1s;
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
.menu-item.delete:hover {
  background: #fff1f0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
