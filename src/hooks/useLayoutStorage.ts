import { ref } from "vue";

interface Group {
  id: string;
  name: string;
  icon: string;
  layout: any[];
}

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

const STORAGE_KEY = "vvtab-groups-v2"; // 升级版本号，避免旧数据冲突

export function useLayoutStorage() {
  const currentGroupIndex = ref(0);
  const groups = ref<Group[]>(JSON.parse(JSON.stringify(defaultGroups)));
  const isLoaded = ref(false);

  // --- 基础加载与保存 ---
  const loadData = () => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data = result[STORAGE_KEY];
        if (data && Array.isArray(data) && data.length > 0) {
          groups.value = data;
        }
        isLoaded.value = true;
      });
    } else {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) groups.value = JSON.parse(localData);
      isLoaded.value = true;
    }
  };

  const saveData = () => {
    if (!isLoaded.value) return;
    const dataToSave = JSON.parse(JSON.stringify(groups.value));
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

  const switchGroup = (index: number) => {
    currentGroupIndex.value = index;
  };

  // --- 新增功能 ---

  // 1. 新增分组
  const addGroup = () => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: `分组 ${groups.value.length + 1}`,
      icon: "📁", // 默认图标
      layout: [],
    };
    groups.value.push(newGroup);
    // 自动跳转到新分组
    currentGroupIndex.value = groups.value.length - 1;
    saveData();
  };

  // 2. 删除分组
  const deleteGroup = (index: number) => {
    if (groups.value.length <= 1) {
      alert("至少保留一个分组！");
      return;
    }
    const name = groups.value[index]?.name ?? `分组 ${index + 1}`;
    const confirmDelete = confirm(
      `确定要删除“${name}”吗？里面的组件也会消失。`
    );
    if (!confirmDelete) return;

    groups.value.splice(index, 1);

    // 如果删除的是当前选中的，或者前面的，需要修正 currentGroupIndex
    if (currentGroupIndex.value >= index) {
      currentGroupIndex.value = Math.max(0, currentGroupIndex.value - 1);
    }
    saveData();
  };

  // 3. 移动组件到其他分组
  const moveWidgetToGroup = (widgetId: string, targetGroupIndex: number) => {
    const sourceGroup = groups.value[currentGroupIndex.value];
    const targetGroup = groups.value[targetGroupIndex];

    if (!sourceGroup || !targetGroup) return;

    // 找到组件
    const widgetIndex = sourceGroup.layout.findIndex(
      (item: any) => item.i === widgetId
    );
    if (widgetIndex === -1) return;

    // 取出组件
    const [widget] = sourceGroup.layout.splice(widgetIndex, 1);

    // 重置组件位置 (放到目标组的左上角，或者利用网格库自动找空位)
    // 这里简单处理：放到 (0,0)，网格库会自动处理重叠
    widget.x = 0;
    widget.y = 0;

    // 放入目标组
    targetGroup.layout.push(widget);

    saveData();
    alert(`已移动到 ${targetGroup.name}`);
  };

  return {
    groups,
    currentGroupIndex,
    switchGroup,
    loadData,
    saveData,
    addGroup,
    deleteGroup,
    moveWidgetToGroup,
  };
}
