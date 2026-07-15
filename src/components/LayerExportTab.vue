<template>
  <div>
    <SectionCollapsible sectionKey="tab3-export-settings" title="导出设置">
      <div class="row">
        <label>导出路径</label>
        <div class="export-path-row">
          <input type="text" v-model="exportPath" placeholder="选择导出路径..." />
          <button class="btn btn-sm" @click="handleBrowse">浏览</button>
        </div>
      </div>
      <div class="row">
        <label>导出格式</label>
        <select v-model="format" @change="saveSettings">
          <option value="PNGFormat">PNG</option>
          <option value="JPEG">JPG</option>
          <option value="bMPFormat">BMP</option>
        </select>
      </div>
      <div class="row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="includeHidden" @change="saveSettings" />
          <span>导出不可见图层</span>
        </label>
      </div>
      <div class="row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="exportXML" @change="saveSettings" />
          <span>导出图层信息 XML (manifest.xml)</span>
        </label>
      </div>
      <div class="row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="folderHierarchy" @change="saveSettings" />
          <span>保留文件夹层级</span>
        </label>
      </div>
      <div class="row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="trimTransparent" @change="saveSettings" />
          <span>裁剪透明像素</span>
        </label>
      </div>
    </SectionCollapsible>

    <SectionCollapsible sectionKey="tab3-export-actions" title="导出操作">
      <div class="export-actions">
        <button class="btn btn-primary" @click="doExport(() => psBridge.collectLayersForExport(includeHidden))">导出选中图层</button>
        <button class="btn" @click="doExport(() => psBridge.collectGroupLayersForExport(includeHidden), true)">导出选中图层组</button>
        <button class="btn" @click="doExport(() => psBridge.collectAllLayersForExport(includeHidden))">导出全部图层</button>
      </div>
      <div v-if="progress" class="export-progress" style="display: block">
        <span class="progress-text">导出中... {{ progress.current }}/{{ progress.total }}</span>
      </div>
    </SectionCollapsible>

    <SectionCollapsible sectionKey="tab3-export-result" title="导出结果">
      <div class="export-result-list">
        <div v-if="results.length === 0" class="empty-state">尚未导出</div>
        <div v-for="(r, i) in results" :key="i" class="export-result-item">
          {{ r.filePath }} ({{ r.w }}×{{ r.h }})
        </div>
      </div>
    </SectionCollapsible>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import { psBridge, type ExportFormat } from "../bridge";
import SectionCollapsible from "./SectionCollapsible.vue";
import { getRootGroupPaths, computeRelativePath } from "../utils";

const emit = defineEmits(["status"]);
const showToast = inject<(msg: string, isError?: boolean) => void>("showToast")!;

const SETTINGS_KEY = "layerTool.exportSettings.v1";

const exportPath = ref("");
const format = ref<ExportFormat>("PNGFormat");
const includeHidden = ref(false);
const exportXML = ref(false);
const folderHierarchy = ref(false);
const trimTransparent = ref(true);
const progress = ref<{ current: number; total: number } | null>(null);
const results = ref<Array<{ filePath: string; w: number; h: number }>>([]);

onMounted(async () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.format) format.value = s.format;
      if (s.includeHidden !== undefined) includeHidden.value = s.includeHidden;
      if (s.exportXML !== undefined) exportXML.value = s.exportXML;
      if (s.folderHierarchy !== undefined) folderHierarchy.value = s.folderHierarchy;
      if (s.trimTransparent !== undefined) trimTransparent.value = s.trimTransparent;
    }
  } catch { /* ignore */ }

  const result = await psBridge.getDocumentPath();
  if (result.success && result.data && result.data.path) {
    exportPath.value = result.data.path + "/export";
  }
});

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    format: format.value, includeHidden: includeHidden.value,
    exportXML: exportXML.value, folderHierarchy: folderHierarchy.value,
    trimTransparent: trimTransparent.value,
  }));
}

async function handleBrowse() {
  const result = await psBridge.selectFolderDialog();
  if (result.success && result.data) exportPath.value = result.data.path;
}

async function doExport(collectFn: () => Promise<any>, isGroup = false) {
  if (!exportPath.value) { emit("status", "请先选择导出路径", true); showToast("请先选择导出路径", true); return; }
  const dirResult = await psBridge.ensureDirectory(exportPath.value);
  if (!dirResult.success) { emit("status", "创建导出目录失败", true); showToast("创建导出目录失败: " + dirResult.error, true); return; }
  const snapshot = await psBridge.saveHistoryState();
  if (!snapshot.success) { emit("status", "保存历史状态失败", true); showToast("保存历史状态失败: " + snapshot.error, true); return; }

  const collectResult = await collectFn();
  if (!collectResult.success || !collectResult.data) {
    emit("status", "收集图层失败", true);
    showToast("收集图层失败: " + collectResult.error, true);
    await psBridge.restoreHistoryState();
    return;
  }
  const layers = collectResult.data.layers;
  if (layers.length === 0) {
    var emptyMsg = isGroup ? "选中的图层组内没有可导出的图层" : "未选中图层（或选中的都是图层组）";
    emit("status", emptyMsg, true);
    showToast(emptyMsg, true);
    await psBridge.restoreHistoryState();
    return;
  }

  const selectedGroupPaths = collectResult.data.selectedGroupPaths || [];
  const rootGroupPaths = getRootGroupPaths(selectedGroupPaths);

  progress.value = { current: 0, total: layers.length };
  const exportResults: any[] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const groupPath = folderHierarchy.value ? layer.groupPath : computeRelativePath(layer.groupPath, rootGroupPaths);
    const exportResult = await psBridge.exportSingleLayer(layer.id, exportPath.value, format.value, groupPath, includeHidden.value, trimTransparent.value);
    if (exportResult.success && exportResult.data) exportResults.push(exportResult.data);
    progress.value = { current: i + 1, total: layers.length };
  }
  progress.value = null;

  if (exportXML.value && exportResults.length > 0) {
    await psBridge.exportLayerInfoXML(exportPath.value, JSON.stringify(exportResults));
  }
  await psBridge.restoreHistoryState();

  results.value = exportResults.filter((r: any) => !r.skipped);
  var doneMsg = "已导出 " + exportResults.length + " 个文件";
  emit("status", doneMsg);
  showToast(doneMsg);
}
</script>

<style scoped>
.export-path-row {
  display: flex;
  align-items: center;
}

.export-path-row > * + * {
  margin-left: 6px;
}

.export-path-row input {
  flex: 1;
}

.export-actions {
  display: flex;
  flex-direction: column;
}

.export-actions > * + * {
  margin-top: 8px;
}

.export-progress {
  margin-top: 8px;
  text-align: center;
}

.progress-text {
  font-size: 11px;
  color: var(--text-muted);
}

.export-result-list {
  max-height: 200px;
  overflow-y: auto;
}

.export-result-item {
  padding: 6px 8px;
  font-size: 11px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  font-family: Consolas, Monaco, monospace;
}

.export-result-item:last-child {
  border-bottom: none;
}
</style>
