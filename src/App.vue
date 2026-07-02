<template>
  <div class="container" @click="handleContainerClick">
    <div class="header card">
      <h1>图层处理工具</h1>
      <DocInfo />
    </div>

    <TabBar v-model="activeTab" />

    <LayerInfoTab
      v-if="activeTab === 'layerInfo'"
      ref="layerInfoTabRef"
      @status="handleStatus"
      @save-preset="handleSavePreset"
    />
    <TemplateOutputTab
      v-if="activeTab === 'templateOutput'"
      ref="templateOutputTabRef"
      @status="handleStatus"
      @save-preset="handleSavePreset"
    />
    <LayerExportTab v-if="activeTab === 'layerExport'" @status="handleStatus" />
    <XmlTemplateTab v-if="activeTab === 'xmlTemplate'" @status="handleStatus" />

    <!-- 统一预设列表 -->
    <SectionCollapsible sectionKey="unified-preset-list" title="预设列表">
      <UnifiedPresetList
        :presets="presets"
        @apply="handlePresetApply"
        @delete="handlePresetDelete"
        @reorder="handlePresetReorder"
      />
    </SectionCollapsible>

    <StatusBar :message="statusMsg" :isError="statusError" />
    <DebugPanel />
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, watch } from "vue";
import type { TabId, PresetCardData } from "./types";
import TabBar from "./components/TabBar.vue";
import DocInfo from "./components/DocInfo.vue";
import StatusBar from "./components/StatusBar.vue";
import DebugPanel from "./components/DebugPanel.vue";
import Toast from "./components/Toast.vue";
import SectionCollapsible from "./components/SectionCollapsible.vue";
import UnifiedPresetList from "./components/UnifiedPresetList.vue";
import LayerInfoTab from "./components/LayerInfoTab.vue";
import TemplateOutputTab from "./components/TemplateOutputTab.vue";
import LayerExportTab from "./components/LayerExportTab.vue";
import XmlTemplateTab from "./components/XmlTemplateTab.vue";
import { usePreset } from "./composables/usePreset";

// Tab 管理
const activeTab = ref<TabId>((() => {
  try {
    const saved = localStorage.getItem("layerTool.activeTab.v1");
    if (saved && ["layerInfo", "templateOutput", "layerExport", "xmlTemplate"].indexOf(saved) >= 0) {
      return saved as TabId;
    }
  } catch { /* ignore */ }
  return "layerInfo";
})());

watch(activeTab, (tab) => {
  localStorage.setItem("layerTool.activeTab.v1", tab);
});

// 统一预设管理
const { presets, save, remove, reorder } = usePreset();

// Tab 组件引用
const layerInfoTabRef = ref<InstanceType<typeof LayerInfoTab> | null>(null);
const templateOutputTabRef = ref<InstanceType<typeof TemplateOutputTab> | null>(null);

// 状态管理
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

/**
 * 处理预设卡片点击：切换 Tab + 应用预设 + 自动执行
 */
async function handlePresetApply(preset: PresetCardData) {
  const targetTab = preset.tab as TabId;

  // 如果需要切换 Tab
  if (activeTab.value !== targetTab) {
    activeTab.value = targetTab;
    handleStatus(`已切换到${targetTab === 'layerInfo' ? '图层信息' : '模板输出'}`);
    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 应用预设并执行获取
  if (targetTab === 'layerInfo' && layerInfoTabRef.value) {
    await layerInfoTabRef.value.applyAndFetch(preset);
  } else if (targetTab === 'templateOutput' && templateOutputTabRef.value) {
    await templateOutputTabRef.value.applyAndFetch(preset);
  }
}

/**
 * 处理保存预设
 */
async function handleSavePreset(config: PresetCardData) {
  await save(config, config.name, config.tab);
  handleStatus(`预设已保存：${config.name}`);
}

/**
 * 处理删除预设
 */
async function handlePresetDelete(id: string) {
  await remove(id);
  handleStatus("预设已删除");
}

/**
 * 处理预设排序
 */
async function handlePresetReorder(fromId: string, toId: string) {
  await reorder(fromId, toId);
  handleStatus("预设顺序已更新");
}
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
