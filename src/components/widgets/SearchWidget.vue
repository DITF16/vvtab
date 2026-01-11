<template>
  <div class="search-container" @mousedown.stop>
    <input
      v-model="keyword"
      class="search-input"
      placeholder="Search Google..."
      @keydown.enter="onSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const keyword = ref("");

const onSearch = () => {
  if (!keyword.value) return;
  // 跳转到 Google 搜索
  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
    keyword.value
  )}`;
};
</script>

<style scoped>
.search-container {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  box-sizing: border-box;
  border-radius: 20px; /* 跟随卡片圆角 */
  background: transparent; /* 背景透明，依靠卡片背景 */
}

.search-input {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  padding: 0 15px;
  font-size: 16px;
  outline: none;
  background: #f5f5f7;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 加点阴影 */
  border: none; /* 去掉边框 */
  text-align: center; /* 文字居中更有设计感 */
}

.search-input:focus {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}
</style>
