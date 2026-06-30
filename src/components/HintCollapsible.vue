<template>
  <div
    :class="['hint-collapsible', isExpanded ? 'expanded' : 'collapsed']"
    :data-hint-key="hintKey"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="hint-header" @click="handleClick">
      <span class="hint-toggle-icon">▼</span>
      <span>{{ title }}</span>
    </div>
    <div class="hint-body" @click="handleBodyClick">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import { psBridge } from "../bridge";

const props = defineProps<{ hintKey: string; title: string }>();
const showToast = inject<(msg: string, isError?: boolean) => void>("showToast")!;

// 手动展开状态：null=未手动操作，true=手动展开，false=手动折叠
const manualExpanded = ref<boolean | null>(null);
// hover 临时展开
const hoverExpanded = ref(false);
let expandTimer: number | null = null;

function loadSaved(): boolean {
  try {
    const raw = localStorage.getItem("layerTool.hintStates.v1");
    const states: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    return states[props.hintKey] !== false;
  } catch { return true; }
}

// 初始状态：从 localStorage 读取
const savedExpanded = loadSaved();
// 如果保存的是展开，则设为手动展开
if (savedExpanded) {
  manualExpanded.value = true;
}

// 最终展开状态：手动展开 || hover 临时展开
const isExpanded = ref(manualExpanded.value === true || hoverExpanded.value);

function updateExpanded() {
  isExpanded.value = manualExpanded.value === true || hoverExpanded.value;
}

function saveState(expanded: boolean) {
  try {
    const raw = localStorage.getItem("layerTool.hintStates.v1");
    const states: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    states[props.hintKey] = expanded;
    localStorage.setItem("layerTool.hintStates.v1", JSON.stringify(states));
  } catch { /* ignore */ }
}

function handleClick() {
  if (expandTimer) { clearTimeout(expandTimer); expandTimer = null; }
  hoverExpanded.value = false;

  if (manualExpanded.value === true) {
    // 当前是手动展开 → 折叠
    manualExpanded.value = false;
    saveState(false);
  } else {
    // 当前是手动折叠或未操作 → 展开
    manualExpanded.value = true;
    saveState(true);
  }
  updateExpanded();
}

function handleMouseEnter() {
  // 如果已手动展开，不做任何事
  if (manualExpanded.value === true) return;
  if (expandTimer) clearTimeout(expandTimer);
  expandTimer = window.setTimeout(() => {
    hoverExpanded.value = true;
    updateExpanded();
  }, 500);
}

function handleMouseLeave() {
  if (expandTimer) { clearTimeout(expandTimer); expandTimer = null; }
  // 如果已手动展开，不做任何事
  if (manualExpanded.value === true) return;
  hoverExpanded.value = false;
  updateExpanded();
}

async function handleBodyClick(e: MouseEvent) {
  const item = (e.target as HTMLElement).closest(".hint-item");
  if (!item) return;
  const varEl = item.querySelector(".hint-var");
  if (!varEl) return;
  const varText = varEl.textContent || "";
  const result = await psBridge.copyText(varText);
  if (result.success) showToast("复制成功 " + varText);
  else showToast("复制失败", true);
}
</script>

<style scoped>
.hint-collapsible {
  margin-top: 6px;
}

.hint-collapsible .hint-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  color: var(--text-secondary);
  transition: background 0.15s;
}

.hint-collapsible.expanded .hint-header {
  border-radius: 6px 6px 0 0;
}

.hint-collapsible.collapsed .hint-header {
  border-radius: 6px;
}

.hint-collapsible .hint-header:hover {
  background: var(--border);
}

.hint-collapsible .hint-toggle-icon {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
  margin-right: 8px;
}

.hint-collapsible.collapsed .hint-toggle-icon {
  transform: rotate(-90deg);
}

.hint-collapsible .hint-body {
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 6px 6px;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.2s ease-out, opacity 0.15s ease-out;
}

.hint-collapsible.expanded .hint-body {
  max-height: 2000px;
  opacity: 1;
  overflow-y: auto;
  overflow-x: auto;
}

.hint-collapsible.collapsed .hint-body {
  max-height: 0;
  opacity: 0;
  border: none;
}
</style>
