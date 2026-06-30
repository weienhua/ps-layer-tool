import { ref, onMounted } from "vue";
import { psBridge } from "../bridge";

function getExtensionPathSync(): string {
  try {
    const cs = new (window as any).CSInterface();
    return cs.getSystemPath("extension") || "";
  } catch {
    return "";
  }
}

/**
 * 通用预设管理 composable
 * @param storageKey localStorage key
 * @param fileDir dist/lib/ 下的子目录名（如 "tab1"）
 * @param defaultPresets 默认预设数组
 */
export function usePreset<T extends { id: string; name: string }>(
  storageKey: string,
  fileDir: string,
  defaultPresets: T[]
) {
  const presets = ref<T[]>([]) as any;

  async function load() {
    try {
      const extPath = getExtensionPathSync();
      if (extPath) {
        const dir = extPath + "/dist/lib/presets/" + fileDir;
        const filePath = dir + "/default.json";
        await psBridge.ensureDirectory(dir);

        const fileResult = await psBridge.readFile(filePath);
        if (fileResult.success && fileResult.data) {
          const parsed = JSON.parse(fileResult.data as string) as T[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            presets.value = parsed;
            localStorage.setItem(storageKey, JSON.stringify(parsed));
            return;
          }
        }

        const localData = localStorage.getItem(storageKey);
        if (localData) {
          const parsed = JSON.parse(localData) as T[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            presets.value = parsed;
            await psBridge.writeFile(filePath, JSON.stringify(parsed, null, 2));
            return;
          }
        }

        presets.value = defaultPresets.slice();
        await psBridge.writeFile(filePath, JSON.stringify(presets.value, null, 2));
        return;
      }
    } catch { /* fallback */ }

    const localData = localStorage.getItem(storageKey);
    if (localData) {
      const parsed = JSON.parse(localData) as T[];
      if (Array.isArray(parsed)) {
        presets.value = parsed;
        return;
      }
    }
    presets.value = defaultPresets.slice();
  }

  async function persist() {
    localStorage.setItem(storageKey, JSON.stringify(presets.value));
    try {
      const extPath = getExtensionPathSync();
      if (extPath) {
        const dir = extPath + "/dist/lib/presets/" + fileDir;
        await psBridge.ensureDirectory(dir);
        await psBridge.writeFile(dir + "/default.json", JSON.stringify(presets.value, null, 2));
      }
    } catch { /* ignore */ }
  }

  async function save(config: T, currentName: string) {
    const idx = presets.value.findIndex((p: T) => p.name === currentName);
    const isNew = idx < 0;
    const preset = { ...config, id: isNew ? String(Date.now()) : presets.value[idx].id };
    if (idx >= 0) presets.value[idx] = preset;
    else presets.value.push(preset);
    await persist();
    return isNew;
  }

  async function remove(id: string) {
    presets.value = presets.value.filter((p: T) => p.id !== id);
    await persist();
  }

  async function reorder(fromId: string, toId: string) {
    const fromIdx = presets.value.findIndex((p: T) => p.id === fromId);
    const toIdx = presets.value.findIndex((p: T) => p.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [dragged] = presets.value.splice(fromIdx, 1);
    presets.value.splice(toIdx, 0, dragged);
    await persist();
  }

  onMounted(load);

  return { presets, save, remove, reorder, persist, load };
}
