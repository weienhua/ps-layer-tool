import { ref, onMounted } from "vue";
import { psBridge } from "../bridge";
import type { PresetCardData } from "../types";

function getExtensionPathSync(): string {
  try {
    const cs = new (window as any).CSInterface();
    return cs.getSystemPath("extension") || "";
  } catch {
    return "";
  }
}

/**
 * 统一预设管理 composable
 * 支持 Tab1 和 Tab2 预设合并存储
 */

const STORAGE_KEY = "layerTool.presets.all.v1";
const FILE_DIR = "all";
const OLD_STORAGE_KEYS = {
  layerInfo: "layerTool.presets.v1",
  templateOutput: "layerTool.templateOutputPresets.v1",
};
const OLD_FILE_DIRS = {
  layerInfo: "tab1",
  templateOutput: "tab2",
};

export function usePreset() {
  const presets = ref<PresetCardData[]>([]);

  async function load() {
    try {
      const extPath = getExtensionPathSync();
      if (extPath) {
        const dir = extPath + "/dist/lib/presets/" + FILE_DIR;
        const filePath = dir + "/default.json";
        await psBridge.ensureDirectory(dir);

        // 尝试从新路径加载
        const fileResult = await psBridge.readFile(filePath);
        if (fileResult.success && fileResult.data) {
          const parsed = JSON.parse(fileResult.data as string) as PresetCardData[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            presets.value = parsed;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            return;
          }
        }

        // 尝试从 localStorage 新 key 加载
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData) as PresetCardData[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            presets.value = parsed;
            await psBridge.writeFile(filePath, JSON.stringify(presets.value, null, 2));
            return;
          }
        }

        // 执行迁移：从旧存储合并
        const migrated = await migrateFromOldStorage(extPath);
        if (migrated.length > 0) {
          presets.value = migrated;
          await persist();
          return;
        }

        // 无任何数据
        presets.value = [];
        return;
      }
    } catch { /* fallback */ }

    // 无扩展路径时的 fallback
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      const parsed = JSON.parse(localData) as PresetCardData[];
      if (Array.isArray(parsed)) {
        presets.value = parsed;
        return;
      }
    }
    presets.value = [];
  }

  /**
   * 从旧存储迁移预设数据（合并去重）
   */
  async function migrateFromOldStorage(extPath: string): Promise<PresetCardData[]> {
    const result: PresetCardData[] = [];

    // 迁移 Tab1（合并文件和 localStorage）
    const tab1Presets = await loadAndMergeOldPresets(extPath, "layerInfo");
    result.push(...tab1Presets);

    // 迁移 Tab2（合并文件和 localStorage）
    const tab2Presets = await loadAndMergeOldPresets(extPath, "templateOutput");
    result.push(...tab2Presets);

    return result;
  }

  /**
   * 加载并合并旧存储中的预设（文件 + localStorage 合并去重）
   */
  async function loadAndMergeOldPresets(extPath: string, tab: 'layerInfo' | 'templateOutput'): Promise<PresetCardData[]> {
    const fileDir = OLD_FILE_DIRS[tab];
    const storageKey = OLD_STORAGE_KEYS[tab];
    const filePresets: any[] = [];
    const localPresets: any[] = [];

    // 从旧文件加载
    if (extPath) {
      try {
        const filePath = extPath + "/dist/lib/presets/" + fileDir + "/default.json";
        const fileResult = await psBridge.readFile(filePath);
        if (fileResult.success && fileResult.data) {
          const parsed = JSON.parse(fileResult.data as string) as any[];
          if (Array.isArray(parsed)) {
            filePresets.push(...parsed);
          }
        }
      } catch { /* ignore */ }
    }

    // 从旧 localStorage 加载
    try {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        const parsed = JSON.parse(localData) as any[];
        if (Array.isArray(parsed)) {
          localPresets.push(...parsed);
        }
      }
    } catch { /* ignore */ }

    // 合并去重：以 name 为 key 去重，localStorage 优先（因为可能更新）
    const merged = new Map<string, any>();

    // 先添加文件预设
    for (const p of filePresets) {
      if (p.name) {
        merged.set(p.name, p);
      }
    }

    // 再添加 localStorage 预设（覆盖同名的文件预设）
    for (const p of localPresets) {
      if (p.name) {
        merged.set(p.name, p);
      }
    }

    // 转换为 PresetCardData 并添加 tab 字段
    return Array.from(merged.values()).map(p => ({
      id: p.id || String(Date.now()),
      name: p.name,
      anchor: p.anchor || 'topLeft',
      sortBy: p.sortBy || 'xAsc',
      template: p.template || '',
      tab,
    }));
  }

  async function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value));
    try {
      const extPath = getExtensionPathSync();
      if (extPath) {
        const dir = extPath + "/dist/lib/presets/" + FILE_DIR;
        await psBridge.ensureDirectory(dir);
        await psBridge.writeFile(dir + "/default.json", JSON.stringify(presets.value, null, 2));
      }
    } catch { /* ignore */ }
  }

  /**
   * 保存预设
   * @param config 预设配置
   * @param currentName 当前预设名（用于判断是新增还是更新）
   * @param tab 来源 Tab
   */
  async function save(config: PresetCardData, currentName: string, tab: 'layerInfo' | 'templateOutput') {
    const idx = presets.value.findIndex(p => p.name === currentName && p.tab === tab);
    const isNew = idx < 0;
    const preset: PresetCardData = {
      ...config,
      id: isNew ? String(Date.now()) : presets.value[idx].id,
      tab,
    };

    if (idx >= 0) {
      presets.value[idx] = preset;
    } else {
      // 新预设追加到列表末尾
      presets.value.push(preset);
    }

    await persist();
    return isNew;
  }

  async function remove(id: string) {
    presets.value = presets.value.filter(p => p.id !== id);
    await persist();
  }

  async function reorder(fromId: string, toId: string) {
    const fromIdx = presets.value.findIndex(p => p.id === fromId);
    const toIdx = presets.value.findIndex(p => p.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [dragged] = presets.value.splice(fromIdx, 1);
    presets.value.splice(toIdx, 0, dragged);
    await persist();
  }

  /**
   * 根据 Tab 筛选预设
   */
  function filterByTab(tab?: 'layerInfo' | 'templateOutput'): PresetCardData[] {
    if (!tab) return presets.value;
    return presets.value.filter(p => p.tab === tab);
  }

  onMounted(load);

  return { presets, save, remove, reorder, persist, load, filterByTab };
}
