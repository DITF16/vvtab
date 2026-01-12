import { ref } from "vue";

// --- 接口定义 ---
interface Group {
  id: string;
  name: string;
  icon: string;
  layout: any[];
}

interface WallpaperConfig {
  type: "static" | "rotation";
  images: string[];
  staticImage: string;
  interval: number;
}

// --- 默认数据 ---
const defaultGroups: Group[] = [
  {
    id: "home",
    name: "主页",
    icon: "🏠",
    layout: [
      { x: 1, y: 1, w: 3, h: 2, i: "clock-1", type: "Clock" },
      { x: 4, y: 3, w: 4, h: 1, i: "search-1", type: "Search" },
    ],
  },
  {
    id: "work",
    name: "工作",
    icon: "💼",
    layout: [],
  },
];

const defaultWallpaper: WallpaperConfig = {
  type: "static",
  images: [
    // 使用 picsum 的随机图，或者你自己找个稳定的图
    "https://picsum.photos/1920/1080",
  ],
  staticImage: "https://picsum.photos/1920/1080",
  interval: 15,
};

const STORAGE_KEY_GROUPS = "vvtab-groups-v2";
const STORAGE_KEY_WALLPAPER = "vvtab-wallpaper-v1";

export function useLayoutStorage() {
  const currentGroupIndex = ref(0);
  const groups = ref<Group[]>(JSON.parse(JSON.stringify(defaultGroups)));
  const wallpaperConfig = ref<WallpaperConfig>(
    JSON.parse(JSON.stringify(defaultWallpaper))
  );
  const isLoaded = ref(false);

  // --- 加载与保存 ---
  const loadData = () => {
    const loadGroups = (data: any) => {
      if (data && Array.isArray(data) && data.length > 0) groups.value = data;
    };
    const loadWallpaper = (data: any) => {
      if (data && data.images)
        wallpaperConfig.value = { ...defaultWallpaper, ...data };
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(
        [STORAGE_KEY_GROUPS, STORAGE_KEY_WALLPAPER],
        (result) => {
          loadGroups(result[STORAGE_KEY_GROUPS]);
          loadWallpaper(result[STORAGE_KEY_WALLPAPER]);
          isLoaded.value = true;
        }
      );
    } else {
      const localGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
      const localWall = localStorage.getItem(STORAGE_KEY_WALLPAPER);
      if (localGroups) loadGroups(JSON.parse(localGroups));
      if (localWall) loadWallpaper(JSON.parse(localWall));
      isLoaded.value = true;
    }
  };

  const saveData = () => {
    if (!isLoaded.value) return;
    const groupsData = JSON.parse(JSON.stringify(groups.value));
    const wallpaperData = JSON.parse(JSON.stringify(wallpaperConfig.value));

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({
        [STORAGE_KEY_GROUPS]: groupsData,
        [STORAGE_KEY_WALLPAPER]: wallpaperData,
      });
    } else {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groupsData));
      localStorage.setItem(
        STORAGE_KEY_WALLPAPER,
        JSON.stringify(wallpaperData)
      );
    }
  };

  const switchGroup = (index: number) => {
    currentGroupIndex.value = index;
  };

  // --- 分组操作 (核心修改) ---

  // 1. 新增分组 (现在接收 name 和 icon)
  const addGroup = (name: string, icon: string) => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: name,
      icon: icon,
      layout: [],
    };
    groups.value.push(newGroup);
    currentGroupIndex.value = groups.value.length - 1;
    saveData();
  };

  // 2. 更新分组 (新增方法)
  const updateGroup = (index: number, name: string, icon: string) => {
    if (groups.value[index]) {
      groups.value[index].name = name;
      groups.value[index].icon = icon;
      saveData();
    }
  };

  // 3. 删除分组
  const deleteGroup = (index: number) => {
    if (groups.value.length <= 1) {
      alert("至少保留一个分组！");
      return;
    }
    // 注意：这里的 confirm 移到了 UI 层 (App.vue) 处理，这里只负责删数据
    groups.value.splice(index, 1);
    if (currentGroupIndex.value >= index) {
      currentGroupIndex.value = Math.max(0, currentGroupIndex.value - 1);
    }
    saveData();
  };

  // --- 组件操作 ---
  const moveWidgetToGroup = (widgetId: string, targetGroupIndex: number) => {
    const sourceGroup = groups.value[currentGroupIndex.value];
    const targetGroup = groups.value[targetGroupIndex];
    if (!sourceGroup || !targetGroup) return;

    const widgetIndex = sourceGroup.layout.findIndex(
      (item: any) => item.i === widgetId
    );
    if (widgetIndex === -1) return;

    const [widget] = sourceGroup.layout.splice(widgetIndex, 1);
    widget.x = 0;
    widget.y = 0;
    targetGroup.layout.push(widget);
    saveData();
  };

  const addWidgetToLayout = (widgetType: string) => {
    const currentGroup = groups.value[currentGroupIndex.value];
    if (!currentGroup) return;
    const yPos = currentGroup.layout.reduce(
      (max: number, item: any) => Math.max(max, item.y + item.h),
      0
    );
    const newWidget = {
      x: 0,
      y: yPos,
      w: 2,
      h: 2,
      i: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetType === "Memo" ? "新备忘录" : undefined,
    };
    if (widgetType === "Search") {
      newWidget.w = 4;
      newWidget.h = 1;
    }
    currentGroup.layout.push(newWidget);
    saveData();
  };

  return {
    groups,
    currentGroupIndex,
    wallpaperConfig,
    switchGroup,
    loadData,
    saveData,
    addGroup,
    updateGroup, // <--- 记得导出
    deleteGroup,
    moveWidgetToGroup,
    addWidgetToLayout,
  };
}
