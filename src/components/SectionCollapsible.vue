<template>
  <div :class="['section', 'card', 'section-collapsible', { collapsed: !expanded }]" :data-section-key="sectionKey">
    <div class="section-header" @click="toggle">
      <span class="section-toggle-icon">▼</span>
      <div class="section-title">{{ title }}</div>
    </div>
    <div class="section-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  sectionKey: string;
  title: string;
  defaultExpanded?: boolean;
}>();

function loadExpanded(): boolean {
  try {
    const raw = localStorage.getItem("layerTool.sectionStates.v1");
    const states: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    return states[props.sectionKey] !== undefined ? states[props.sectionKey] : props.defaultExpanded !== false;
  } catch {
    return props.defaultExpanded !== false;
  }
}

const expanded = ref(loadExpanded());

function toggle() {
  expanded.value = !expanded.value;
  try {
    const raw = localStorage.getItem("layerTool.sectionStates.v1");
    const states: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    states[props.sectionKey] = expanded.value;
    localStorage.setItem("layerTool.sectionStates.v1", JSON.stringify(states));
  } catch { /* ignore */ }
}
</script>

<style scoped>
.section-collapsible .section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  padding: 2px 0;
}

.section-collapsible .section-header .section-title {
  margin-bottom: 0;
  margin-left: 8px;
}

.section-collapsible .section-toggle-icon {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.section-collapsible.collapsed .section-toggle-icon {
  transform: rotate(-90deg);
}

.section-collapsible .section-body {
  margin-top: 8px;
}

.section-collapsible.collapsed .section-body {
  display: none;
}
</style>
