<template>
  <div class="clock-container">
    <div class="time">{{ timeStr }}</div>
    <div class="date">{{ dateStr }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const timeStr = ref("");
const dateStr = ref("");
let timer: any = null;

const updateTime = () => {
  const now = new Date();

  // 获取时间 HH:MM
  timeStr.value = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24小时制
  });

  // 获取日期 MM月DD日 周几
  dateStr.value = now.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
};

onMounted(() => {
  updateTime();
  // 每秒更新一次
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.clock-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* 类似 iTab 的毛玻璃渐变背景 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  user-select: none;
}

.time {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
}

.date {
  font-size: 1rem;
  opacity: 0.8;
  margin-top: 8px;
}
</style>
