import { ref } from "vue";

// --- 接口定义 ---
interface Group {
  id: string;
  name: string;
  icon: string;
  layout: any[];
}

// 新增：壁纸配置接口
interface WallpaperConfig {
  type: "static" | "rotation"; // 'static'=单张, 'rotation'=轮播
  images: string[]; // 图片列表
  staticImage: string; // 单张模式下选中的图片
  interval: number; // 轮播间隔 (分钟)
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

// 默认必应每日壁纸作为初始壁纸
const defaultWallpaper: WallpaperConfig = {
  type: "static",
  images: [
    "https://bing.com/th?id=OHR.BlueHourItaly_ZH-CN0640826569_1920x1080.jpg",
    "https://bing.com/th?id=OHR.SvalbardPolarBear_ZH-CN0337839352_1920x1080.jpg",
    "https://bing.com/th?id=OHR.RedTailedHawk_ZH-CN0102661022_1920x1080.jpg",
  ],
  staticImage:
    "https://bing.com/th?id=OHR.BlueHourItaly_ZH-CN0640826569_1920x1080.jpg",
  interval: 15, // 默认15分钟
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
    // 1. 加载分组
    const loadGroups = (data: any) => {
      if (data && Array.isArray(data) && data.length > 0) {
        groups.value = data;
      }
    };

    // 2. 加载壁纸
    const loadWallpaper = (data: any) => {
      if (data && data.images) {
        wallpaperConfig.value = { ...defaultWallpaper, ...data };
      }
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

    // 深拷贝数据
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

  // --- 基础操作 ---
  const switchGroup = (index: number) => {
    currentGroupIndex.value = index;
  };

  // --- 分组操作 ---
  const addGroup = () => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: `分组 ${groups.value.length + 1}`,
      icon: "📁",
      layout: [],
    };
    groups.value.push(newGroup);
    currentGroupIndex.value = groups.value.length - 1;
    saveData();
  };

  const deleteGroup = (index: number) => {
    if (groups.value.length <= 1) {
      alert("至少保留一个分组！");
      return;
    }
    const name = groups.value[index]?.name ?? `分组 ${index + 1}`;
    if (!confirm(`确定要删除“${name}”吗？`)) return;

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
    alert(`已移动到 ${targetGroup.name}`);
  };

  const addWidgetToLayout = (widgetType: string) => {
    const currentGroup = groups.value[currentGroupIndex.value];
    if (!currentGroup) return;

    const yPos = currentGroup.layout.reduce(
      (max, item: any) => Math.max(max, item.y + item.h),
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
    wallpaperConfig, // <--- 导出壁纸配置
    switchGroup,
    loadData,
    saveData,
    addGroup,
    deleteGroup,
    moveWidgetToGroup,
    addWidgetToLayout,
  };
}
