import { ref } from "vue";

const defaultLayout = [
  // 注意：因为列数变多了(12)，宽度 w 也要相应变大一点才协调
  // 天气放在左边
  { x: 1, y: 1, w: 3, h: 2, i: "clock-1", type: "Clock" },

  // 搜索框放在中间
  { x: 4, y: 3, w: 4, h: 1, i: "search-1", type: "Search" },

  // 备忘录放在右下角，测试自由布局
  { x: 8, y: 5, w: 2, h: 2, i: "memo-1", type: "Memo", title: "备忘录" },
];

const STORAGE_KEY = "vvtab-layout-v1";

export function useLayoutStorage() {
  const layout = ref<any[]>([]);
  const isLoaded = ref(false);

  // 1. 加载数据
  const loadData = () => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data = result[STORAGE_KEY] as any[];
        if (data && data.length > 0) {
          console.log("✅ 成功读取存储:", data);
          layout.value = data;
        } else {
          console.log("⚠️ 存储为空，使用默认布局");
          layout.value = defaultLayout;
        }
        isLoaded.value = true;
      });
    } else {
      // 开发环境
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        layout.value = JSON.parse(localData) as any[];
      } else {
        layout.value = defaultLayout;
      }
      isLoaded.value = true;
    }
  };

  // 2. 保存数据 (现在我们把它 return 出去，供外部调用)
  const saveData = () => {
    // 如果还没加载完，千万别保存，否则会把空数组存进去
    if (!isLoaded.value) {
      console.warn("❌ 数据尚未加载完成，拒绝保存");
      return;
    }

    const dataToSave = JSON.parse(JSON.stringify(layout.value)); // 深拷贝一份，防止引用问题
    console.log("💾 正在保存布局:", dataToSave);

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ [STORAGE_KEY]: dataToSave }, () => {
        console.log("✅ Chrome Storage 保存成功");
      });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log("✅ LocalStorage 保存成功");
    }
  };

  // 注意：我们删掉了 watch，改为手动触发

  return {
    layout,
    loadData,
    saveData, // <--- 重点：把这个暴露出去
  };
}
