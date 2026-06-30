<template>
  <div class="anchor-row">
    <div class="anchor-grid-selector">
      <button
        v-for="a in anchors"
        :key="a"
        :class="['anchor-grid-cell', { 'is-active': a === modelValue }]"
        type="button"
        :data-anchor="a"
        :aria-label="labels[a]"
        :aria-pressed="a === modelValue"
        @click="$emit('update:modelValue', a)"
      />
    </div>
    <select :value="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-for="a in anchors" :key="a" :value="a">{{ labels[a] }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { AnchorType } from "../types";

defineProps<{ modelValue: AnchorType }>();
defineEmits(["update:modelValue"]);

const anchors: AnchorType[] = [
  "topLeft", "topCenter", "topRight",
  "middleLeft", "center", "middleRight",
  "bottomLeft", "bottomCenter", "bottomRight",
];

const labels: Record<AnchorType, string> = {
  topLeft: "左上", topCenter: "上中", topRight: "右上",
  middleLeft: "左中", center: "中心", middleRight: "右中",
  bottomLeft: "左下", bottomCenter: "下中", bottomRight: "右下",
};
</script>

<style scoped>
.anchor-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
}

.anchor-row > * + * {
  margin-left: 6px;
}

.anchor-grid-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 2px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  flex-shrink: 0;
  width: 58px;
}

.anchor-grid-cell {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-strong);
  background: #2a2f37;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.anchor-grid-cell:hover {
  border-color: var(--primary-hover);
  background: #364354;
}

.anchor-grid-cell.is-active {
  border-color: var(--primary);
  background: var(--primary);
}

.anchor-grid-cell:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(58, 141, 255, 0.25);
}
</style>
