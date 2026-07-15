<template>
  <div class="tab-bar">
    <button
      v-for="tab in displayTabs"
      :key="tab.id"
      :class="['tab-btn', { active: modelValue === tab.id }]"
      @click="$emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue";
import type { TabId } from "../types";

defineProps<{ modelValue: TabId }>();
defineEmits(["update:modelValue"]);

const compact = inject("uiCompact", computed(() => false));

const fullLabels: Record<TabId, string> = {
  layerInfo: "图层信息",
  templateOutput: "模板输出",
  layerExport: "图层处理",
  xmlTemplate: "XML模板",
  curveFit: "曲线拟合",
};

const shortLabels: Record<TabId, string> = {
  layerInfo: "图层",
  templateOutput: "模板",
  layerExport: "导出",
  xmlTemplate: "XML",
  curveFit: "拟合",
};

const tabIds: TabId[] = ["layerInfo", "templateOutput", "layerExport", "xmlTemplate", "curveFit"];

const displayTabs = computed(() => {
  var labels = compact.value ? shortLabels : fullLabels;
  return tabIds.map(function (id) {
    return { id: id, label: labels[id] };
  });
});

</script>

<style scoped>
.tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
}

.tab-btn {
  flex: 1;
  min-width: 44px;
  min-height: 30px;
  padding: 4px 6px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
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
