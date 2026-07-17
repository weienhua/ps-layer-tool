<template>
  <div :class="['unified-preset-list', { 'no-preview': !showPreview }]">
    <!-- 筛选按钮 -->
    <div class="filter-bar">
      <button
        :class="['filter-btn', { active: activeFilter === 'all' }]"
        @click="activeFilter = 'all'"
      >全部</button>
      <button
        :class="['filter-btn', { active: activeFilter === 'layerInfo' }]"
        @click="activeFilter = 'layerInfo'"
      >{{ filterCompact ? '图层' : '图层信息' }}</button>
      <button
        :class="['filter-btn', { active: activeFilter === 'templateOutput' }]"
        @click="activeFilter = 'templateOutput'"
      >{{ filterCompact ? '模板' : '模板输出' }}</button>
      <div class="preview-toggle">
        <span class="preview-label">预览</span>
        <label class="switch">
          <input type="checkbox" :checked="showPreview" @change="togglePreview" />
          <span class="slider" />
        </label>
      </div>
    </div>

    <!-- 预设列表 -->
    <div class="preset-list">
      <div v-if="filteredPresets.length === 0" class="empty-state">暂无预设</div>
      <div
        v-for="preset in filteredPresets"
        :key="preset.id"
        :class="['preset-item', { collapsed: collapseStates[preset.id] !== false }]"
        :data-id="preset.id"
        draggable="true"
        @click="handleClick(preset)"
        @dragstart="onDragStart($event, preset.id)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
      >
        <div class="preset-main">
          <div class="preset-main-left">
            <button class="preset-toggle" aria-label="折叠/展开" @click.stop="toggleCollapse(preset.id, $event)">▼</button>
            <span class="preset-name">{{ preset.name }}</span>
          </div>
          <div class="preset-main-right">
            <span :class="['tab-indicator', preset.tab]">{{ preset.tab === 'layerInfo' ? '1' : '2' }}</span>
            <button class="preset-delete" aria-label="删除预设" @click.stop="$emit('delete', preset.id)">×</button>
          </div>
        </div>
        <div class="preset-meta">
          <span :class="['tab-badge', preset.tab]">{{ preset.tab === 'layerInfo' ? (filterCompact ? '图层' : '图层信息') : (filterCompact ? '模板' : '模板输出') }}</span>
          <div class="preset-anchor-grid">
            <button
              v-for="a in anchorCells"
              :key="a"
              :class="['anchor-grid-cell', { 'is-active': a === preset.anchor }]"
              :data-anchor="a"
              aria-pressed="false"
            />
          </div>
          <span class="sort-badge">{{ sortLabels[preset.sortBy as SortType] || preset.sortBy }}</span>
        </div>
        <div class="preset-template-preview">{{ preset.template || "" }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue";
import type { SortType, PresetCardData } from "../types";

const props = defineProps<{ presets: PresetCardData[] }>();
const emit = defineEmits(["apply", "delete", "reorder"]);

const activeFilter = ref<'all' | 'layerInfo' | 'templateOutput'>('all');
const filterCompact = inject("uiCompact", computed(() => false));

const filteredPresets = computed(() => {
  if (activeFilter.value === 'all') return props.presets;
  return props.presets.filter((p: PresetCardData) => p.tab === activeFilter.value);
});

const anchorCells = [
  "topLeft", "topCenter", "topRight",
  "middleLeft", "center", "middleRight",
  "bottomLeft", "bottomCenter", "bottomRight",
];

const sortLabels: Record<SortType, string> = {
  xAsc: "按 X 升序",
  yAsc: "按 Y 升序",
  psOrderBottomToTop: "按PS图层顺序",
};

function loadCollapseStates(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem("layerTool.presetCollapseStates.v1");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

const collapseStates = ref(loadCollapseStates());

function toggleCollapse(id: string, e: Event) {
  collapseStates.value = { ...collapseStates.value, [id]: collapseStates.value[id] === false };
  localStorage.setItem("layerTool.presetCollapseStates.v1", JSON.stringify(collapseStates.value));
  (e.target as HTMLElement).blur();
}

const PREVIEW_STORAGE_KEY = "layerTool.presetPreviewEnabled.v1";

function loadPreviewEnabled(): boolean {
  try {
    const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch { return true; }
}

const showPreview = ref(loadPreviewEnabled());

function togglePreview() {
  showPreview.value = !showPreview.value;
  localStorage.setItem(PREVIEW_STORAGE_KEY, String(showPreview.value));
}

function handleClick(preset: PresetCardData) {
  emit("apply", preset);
}

let draggedId: string | null = null;

function onDragStart(e: Event, id: string) {
  draggedId = id;
  (e.target as HTMLElement).classList.add("dragging");
}

function onDragEnd(e: Event) {
  (e.target as HTMLElement).classList.remove("dragging");
  draggedId = null;
}

function onDragOver(e: Event) {
  const item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
  if (item && item.dataset.id !== draggedId) {
    item.classList.add("drag-over");
  }
}

function onDragLeave(e: Event) {
  const item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
  if (item) item.classList.remove("drag-over");
}

function onDrop(e: Event) {
  const item = (e.target as HTMLElement).closest(".preset-item") as HTMLElement;
  if (!item) return;
  item.classList.remove("drag-over");
  const targetId = item.dataset.id;
  if (draggedId && targetId && draggedId !== targetId) {
    emit("reorder", draggedId, targetId);
  }
}


</script>

<style scoped>
.unified-preset-list {
  display: flex;
  flex-direction: column;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.filter-btn {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-right: 8px;
}

.filter-btn:last-child {
  margin-right: 0;
}

.filter-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.filter-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: -8px;
  overflow: visible;
  position: relative;
}

.preset-list > * {
  margin-right: 8px;
  margin-bottom: 8px;
}

.empty-state {
  width: 100%;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  padding: 16px 0;
}

.preset-item {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 120px;
  max-width: 200px;
  flex: 1 1 140px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

.preset-item.collapsed {
  justify-content: center;
}

.preset-item.collapsed > * + * {
  margin-top: 0;
}

.preset-item.collapsed .preset-meta,
.preset-item.collapsed .preset-template-preview {
  display: none;
}

.preset-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 9px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease;
  padding: 0;
  margin-right: 8px;
}

.preset-toggle:hover {
  color: var(--text-main);
}

.preset-item.collapsed .preset-toggle {
  transform: rotate(-90deg);
}

.preset-item > * + * {
  margin-top: 6px;
}

.preset-item.dragging {
  opacity: 0.5;
  border-color: var(--primary);
}

.preset-item.drag-over {
  border-color: var(--primary);
  border-style: dashed;
}

.preset-item:hover,
.preset-item:focus-within {
  background: var(--bg-card-hover);
  border-color: var(--primary);
}

.preset-main {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 16px;
  cursor: pointer;
}

.preset-main-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.preset-main-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.preset-main .preset-toggle {
  cursor: pointer;
}

.preset-name {
  font-size: 12px;
  color: var(--text-main);
  font-weight: 500;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 16px;
}

.tab-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.tab-indicator.layerInfo {
  background: rgba(91, 143, 249, 0.15);
  color: #5B8FF9;
}

.tab-indicator.templateOutput {
  background: rgba(90, 216, 166, 0.15);
  color: #5AD8A6;
}

.preset-delete {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--error);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preset-item:hover .preset-delete {
  opacity: 1;
}

.preset-delete:hover {
  opacity: 1;
}

.preset-meta {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  white-space: nowrap;
  font-weight: 500;
}

.tab-badge.layerInfo {
  background: rgba(91, 143, 249, 0.12);
  color: #5B8FF9;
  border: 1px solid rgba(91, 143, 249, 0.3);
}

.tab-badge.templateOutput {
  background: rgba(90, 216, 166, 0.12);
  color: #5AD8A6;
  border: 1px solid rgba(90, 216, 166, 0.3);
}

.preset-anchor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 3px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #20242b;
}

.anchor-grid-cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid #50586a;
  background: #2a2f37;
}

.anchor-grid-cell.is-active {
  border-color: var(--primary);
  background: var(--primary);
}

.sort-badge {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: #2a313b;
  color: var(--text-secondary);
  font-size: 10px;
  white-space: nowrap;
}

.preset-template-preview {
  display: none;
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 35;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border-strong);
  background: #171a20;
  color: #cfd4dd;
  font-size: 10px;
  font-family: Consolas, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 92px;
  overflow-y: auto;
  box-shadow: var(--shadow);
  pointer-events: none;
}

.preset-item:hover .preset-template-preview,
.preset-item:focus-within .preset-template-preview {
  display: block;
}

.unified-preset-list.no-preview .preset-item:hover .preset-template-preview,
.unified-preset-list.no-preview .preset-item:focus-within .preset-template-preview {
  display: none;
}

.preview-toggle {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

.preview-toggle > * + * {
  margin-left: 8px;
}

.preview-label {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  transition: .2s;
  border-radius: 18px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #0d6efd;
}

input:checked + .slider:before {
  transform: translateX(14px);
}
</style>
