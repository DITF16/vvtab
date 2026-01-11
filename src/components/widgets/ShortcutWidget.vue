<template>
  <a :href="url" target="_blank" class="shortcut-container" @mousedown.stop>
    <div class="icon-wrapper">
      <img
        v-if="iconUrl"
        :src="iconUrl"
        class="icon-img"
        @error="handleImgError"
      />
      <span v-else class="icon-text">{{ title.charAt(0) }}</span>
    </div>
    <span class="title">{{ title }}</span>
  </a>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  title?: string;
  url?: string;
  icon?: string; // 父组件传过来的 key 可能是 icon 或 iconUrl
}>();

// 解构并提供默认值，避免模板中出现 undefined
const { title = "", url = "", icon = "" } = props;

// 优先使用传入的 icon，否则尝试用 favicon 服务自动获取
const iconUrl = ref(
  icon || `https://www.google.com/s2/favicons?sz=128&domain_url=${url}`
);

// 如果图片加载失败（比如 Google 服务被墙），回退到文字模式
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
}
</style>
