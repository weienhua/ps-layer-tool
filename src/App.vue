<template>
  <div class="container" @click="handleContainerClick">
    <div class="header card">
      <h1>图层处理工具</h1>
      <DocInfo />
    </div>

    <TabBar v-model="activeTab" />

    <LayerInfoTab v-if="activeTab === 'layerInfo'" @status="handleStatus" />
    <TemplateOutputTab v-if="activeTab === 'templateOutput'" @status="handleStatus" />
    <LayerExportTab v-if="activeTab === 'layerExport'" @status="handleStatus" />
    <XmlTemplateTab v-if="activeTab === 'xmlTemplate'" @status="handleStatus" />

    <StatusBar :message="statusMsg" :isError="statusError" />
    <DebugPanel />
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from "vue";
import type { TabId } from "./types";
import TabBar from "./components/TabBar.vue";
import DocInfo from "./components/DocInfo.vue";
import StatusBar from "./components/StatusBar.vue";
import DebugPanel from "./components/DebugPanel.vue";
import Toast from "./components/Toast.vue";
import LayerInfoTab from "./components/LayerInfoTab.vue";
import TemplateOutputTab from "./components/TemplateOutputTab.vue";
import LayerExportTab from "./components/LayerExportTab.vue";
import XmlTemplateTab from "./components/XmlTemplateTab.vue";

const activeTab = ref<TabId>((() => {
  try {
    const saved = localStorage.getItem("layerTool.activeTab.v1");
    if (saved && ["layerInfo", "templateOutput", "layerExport", "xmlTemplate"].indexOf(saved) >= 0) {
      return saved as TabId;
    }
  } catch { /* ignore */ }
  return "layerInfo";
})());

import { watch } from "vue";
watch(activeTab, (tab) => {
  localStorage.setItem("layerTool.activeTab.v1", tab);
});

const statusMsg = ref("就绪");
const statusError = ref(false);

function handleStatus(msg: string, isError = false) {
  statusMsg.value = msg;
  statusError.value = isError;
}

function handleContainerClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === "BUTTON" || target.closest("button")) {
    const btn = target.tagName === "BUTTON" ? target : target.closest("button");
    (btn as HTMLElement)?.blur();
  }
}

// Toast provider
const toastRef = ref<InstanceType<typeof Toast>>();
provide("showToast", (msg: string, isError = false) => {
  toastRef.value?.showToast(msg, isError);
});
</script>

<style scoped>
.header {
  margin-bottom: 0;
}

.header h1 {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
}
</style>
