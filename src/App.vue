<template>
  <div class="wallpaper-layer"></div>

  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="group-icon active">🏠</div>
        <div class="group-icon">💼</div>
        <div class="group-icon">🎮</div>
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
          v-model:layout="layout"
          :col-num="12"
          :row-height="60"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="false"
          :margin="[20, 20]"
        >
          <GridItem
            v-for="item in layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            class="grid-card-wrapper"
            @moved="handleSave"
            @resized="handleSave"
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
      </div>
    </main>

    <div
      v-if="showSettings"
      class="modal-overlay"
      @click.self="showSettings = false"
    >
      <div class="modal-content">
        <h2>设置中心</h2>
        <div class="tabs">
          <button>个人中心</button>
          <button>壁纸设置</button>
          <button>组件广场</button>
        </div>
        <p style="padding: 20px; color: #666">这里后续放具体的功能...</p>
        <button @click="showSettings = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { useLayoutStorage } from "./hooks/useLayoutStorage";
import ClockWidget from "./components/widgets/ClockWidget.vue";
import SearchWidget from "./components/widgets/SearchWidget.vue";

const { layout, loadData, saveData } = useLayoutStorage();
const showSettings = ref(false);

onMounted(() => {
  loadData();
});

const handleSave = () => {
  saveData();
};

const openSettings = () => {
  showSettings.value = true;
};

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
</script>

<style scoped>
/* 全局容器 */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  z-index: 1; /* 在壁纸之上 */
}

/* 背景层 */
.wallpaper-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 暂时用 CSS 渐变，后续换成 img 标签 */
  background: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
  z-index: 0;
}

/* 左侧侧边栏 */
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
}

.group-icon.active {
  background: white;
  color: #333;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 主区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto; /* 允许垂直滚动 */
}

/* 顶部栏 */
.top-bar {
  height: 60px;
  display: flex;
  justify-content: flex-end; /* 靠右对齐 */
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

/* 网格容器：居中且限制宽度 */
.grid-wrapper {
  width: 100%;
  max-width: 1200px; /* 限制最大宽度，模仿 iTab */
  margin: 0 auto; /* 水平居中 */
  flex: 1; /* 占满剩余高度 */
  padding-top: 20px;
}

/* 卡片样式 */
.grid-card-wrapper {
  /* 去掉 border-radius 和 overflow，让内部组件决定 */
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

/* 简单的模态框样式 */
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

/* 隐藏缩放手柄，只在hover显示 */
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
</style>
