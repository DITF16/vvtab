<template>
  <div class="wallpaper-layer"></div>

  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div
          v-for="(group, index) in groups"
          :key="group.id"
          class="group-icon"
          :class="{ active: currentGroupIndex === index }"
          @click="switchGroup(index)"
          :title="group.name"
        >
          {{ group.icon }}
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
import { ref, onMounted, computed } from "vue";
import { GridLayout, GridItem } from "grid-layout-plus";
import { useLayoutStorage } from "./hooks/useLayoutStorage";
import ClockWidget from "./components/widgets/ClockWidget.vue";
import SearchWidget from "./components/widgets/SearchWidget.vue";

// 引入新的变量
const { groups, currentGroupIndex, switchGroup, loadData, saveData } =
  useLayoutStorage();
const showSettings = ref(false);

const currentLayout = computed({
  get() {
    const group = groups.value?.[currentGroupIndex.value];
    return group ? group.layout : [];
  },
  set(newLayout: any) {
    const group = groups.value?.[currentGroupIndex.value];
    if (group) {
      group.layout = newLayout;
    }
  },
});

onMounted(() => {
  // 重要：因为换了 STORAGE_KEY，最好清理一下旧的缓存（可选）
  // chrome.storage.local.clear();
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
/* 样式完全保持你提供的代码不变，直接复用即可 */
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
</style>
