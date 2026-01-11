<template>
  <div
    class="shortcut-container"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    <div class="icon-wrapper">
      <img
        v-if="iconUrl"
        :src="iconUrl"
        class="icon-img"
        @error="handleImgError"
        draggable="false"
      />
      <span v-else class="icon-text">{{ title.charAt(0) }}</span>
    </div>
    <span class="title">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  title?: string;
  url?: string;
  icon?: string;
}>();

const { title = "", url = "", icon = "" } = props;

const iconUrl = ref(
  icon || `https://www.google.com/s2/favicons?sz=128&domain_url=${url}`
);

// --- 核心修复逻辑开始 ---

let startX = 0;
let startY = 0;
let isDrag = false;

// 1. 鼠标按下时，记录坐标
const handleMouseDown = (e: MouseEvent) => {
  startX = e.clientX;
  startY = e.clientY;
  isDrag = false;
};

// 2. 点击（鼠标松开）时，计算位移
const handleClick = (e: MouseEvent) => {
  const endX = e.clientX;
  const endY = e.clientY;

  // 计算移动距离 (勾股定理，或者简单的 x+y 差值)
  const distance = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  );

  // 如果移动距离超过 5 像素，判定为拖拽，不执行跳转
  if (distance > 5) {
    return;
  }

  // 否则判定为点击，执行跳转
  if (url) {
    window.open(url, "_blank");
  }
};

// --- 核心修复逻辑结束 ---

const handleImgError = () => {
  iconUrl.value = "";
};
</script>

<style scoped>
.shortcut-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  color: inherit;
  transition: transform 0.1s;
  cursor: pointer;
  user-select: none; /* 防止文字被选中变蓝 */
}

.shortcut-container:active {
  transform: scale(0.95);
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  pointer-events: none; /* 让鼠标事件穿透图片 */
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-text {
  font-size: 24px;
  font-weight: bold;
  color: #555;
}

.title {
  font-size: 12px;
  color: #333;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  text-align: center;
  pointer-events: none;
}
</style>
