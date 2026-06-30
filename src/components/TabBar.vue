<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab-btn', { active: modelValue === tab.id }]"
      @click="$emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TabId } from "../types";

defineProps<{ modelValue: TabId }>();
defineEmits(["update:modelValue"]);

const tabs = [
  { id: "layerInfo" as const, label: "图层信息" },
  { id: "templateOutput" as const, label: "模板输出" },
  { id: "layerExport" as const, label: "图层处理" },
  { id: "xmlTemplate" as const, label: "XML模板" },
];
</script>

<style scoped>
.tab-bar {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
}

.tab-bar > * + * {
  margin-left: 4px;
}

.tab-btn {
  flex: 1;
  min-height: 34px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-input);
}

.tab-btn.active {
  background: var(--primary);
  color: #fff;
}
</style>
