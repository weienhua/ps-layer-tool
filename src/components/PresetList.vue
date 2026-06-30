<template>
  <div class="preset-list">
    <div v-if="presets.length === 0" class="empty-state">暂无预设</div>
    <div
      v-for="preset in presets"
      :key="preset.id"
      :class="['preset-item', { collapsed: collapseStates[preset.id] }]"
      :data-id="preset.id"
      draggable="true"
      @click="handleClick(preset.id)"
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
        <button class="preset-delete" aria-label="删除预设" @click.stop="$emit('delete', preset.id)">×</button>
      </div>
      <div class="preset-meta">
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
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { SortType, PresetCardData } from "../types";

defineProps<{ presets: PresetCardData[] }>();
const emit = defineEmits(["apply", "delete", "reorder"]);

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
  collapseStates.value = { ...collapseStates.value, [id]: !collapseStates.value[id] };
  localStorage.setItem("layerTool.presetCollapseStates.v1", JSON.stringify(collapseStates.value));
  // 点击后取消焦点
  (e.target as HTMLElement).blur();
}

function handleClick(id: string) {
  emit("apply", id);
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
.preset-list {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: -8px;
}

.preset-list > * {
  margin-right: 8px;
  margin-bottom: 8px;
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
}

.preset-main .preset-toggle {
  cursor: pointer;
}

.preset-main > * + * {
  margin-left: 8px;
}

.preset-meta {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.preset-meta > * + * {
  margin-left: 6px;
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
  left: 10px;
  right: 10px;
  top: calc(100% + 6px);
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
}

.preset-item:hover .preset-template-preview,
.preset-item:focus-within .preset-template-preview {
  display: block;
}
</style>
