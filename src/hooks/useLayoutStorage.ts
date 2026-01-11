import { ref } from "vue";

// 1. 定义接口：让 TS 知道分组长什么样
interface Group {
  id: string;
  name: string;
  icon: string;
  layout: any[];
}

// 2. 定义默认数据：包含两个分组（主页、工作）
const defaultGroups: Group[] = [
  {
    id: "home",
    name: "主页",
    icon: "🏠",
    layout: [
      { x: 1, y: 1, w: 3, h: 2, i: "clock-1", type: "Clock" },
      { x: 4, y: 3, w: 4, h: 1, i: "search-1", type: "Search" },
      { x: 8, y: 5, w: 2, h: 2, i: "memo-1", type: "Memo", title: "备忘录" },
    ],
  },
  {
    id: "work",
    name: "工作",
    icon: "💼",
    layout: [], // 第二页暂时为空
  },
  {
    id: "fun",
    name: "娱乐",
    icon: "🎮",
    layout: [],
  },
];

const STORAGE_KEY = "vvtab-groups-v1"; // 改个 Key，防止读到旧的脏数据

export function useLayoutStorage() {
  // 当前选中的分组索引 (默认 0)
  const currentGroupIndex = ref(0);

  // 分组数据：初始化直接使用默认值，防止空指针报错
  const groups = ref<Group[]>(JSON.parse(JSON.stringify(defaultGroups)));

  const isLoaded = ref(false);

  // 加载数据
  const loadData = () => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data = result[STORAGE_KEY];
        // 如果读取到了有效数据，就覆盖默认值
        if (data && Array.isArray(data) && data.length > 0) {
          console.log("✅ 读取到分组数据:", data);
          groups.value = data;
        } else {
          console.log("⚠️ 未读取到分组，使用默认配置");
        }
        isLoaded.value = true;
      });
    } else {
      // 开发环境
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        groups.value = JSON.parse(localData);
      }
      isLoaded.value = true;
    }
  };

  // 保存数据
  const saveData = () => {
    if (!isLoaded.value) return;

    const dataToSave = JSON.parse(JSON.stringify(groups.value));
    console.log("💾 保存所有分组:", dataToSave);

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ [STORAGE_KEY]: dataToSave });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  };

  // 切换分组函数
  const switchGroup = (index: number) => {
    currentGroupIndex.value = index;
  };

  return {
    groups, // 导出分组列表
    currentGroupIndex, // 导出当前索引
    switchGroup, // 导出切换函数
    loadData,
    saveData,
  };
}
