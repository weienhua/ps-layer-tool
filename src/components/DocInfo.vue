<template>
  <div class="doc-info">{{ text }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { psBridge } from "../bridge";

const text = ref("未检测到打开的文档");
let timer: number | null = null;

async function refresh() {
  const result = await psBridge.getDocumentInfo();
  if (result.success && result.data) {
    const info = result.data;
    text.value = `${info.name} (${info.width}x${info.height}px)`;
  } else if (result.noDocument) {
    text.value = "未检测到打开的文档";
  }
}

onMounted(() => {
  refresh();
  timer = window.setInterval(refresh, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.doc-info {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
  padding: 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
}
</style>
