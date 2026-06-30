<template>
  <template v-if="isDebug">
    <div class="debug-toggle">
      <span>调试模式</span>
      <label class="switch">
        <input type="checkbox" v-model="enabled" @change="(window as any).DEBUG = enabled" />
        <span class="slider" />
      </label>
    </div>

    <div v-if="enabled" class="debug-panel" style="display: flex">
      <div class="debug-header">
        <span>通信日志</span>
        <button class="btn btn-sm" @click="logs = []">清空</button>
      </div>
      <div class="debug-logs">
        <div v-if="logs.length === 0" class="empty-state">暂无日志</div>
        <div v-for="(log, i) in [...logs].reverse()" :key="i" :class="['debug-log-entry', log.type]">
          <div>
            <span class="debug-log-time">{{ log.time.toLocaleTimeString() }}</span>
            <span class="debug-log-type">{{ log.type === 'send' ? '发送' : log.type === 'receive' ? '接收' : '错误' }}</span>
            <span v-if="log.data.duration" class="debug-log-duration">{{ log.data.duration }}ms</span>
          </div>
          <div class="debug-log-content">{{ getContent(log) }}</div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { setLogCallback } from "../bridge";

const isDebug = __DEBUG__;
const enabled = ref(false);

interface LogEntry {
  type: "send" | "receive" | "error";
  data: any;
  time: Date;
}

const logs = ref<LogEntry[]>([]);

function getContent(log: LogEntry): string {
  if (log.type === "send") return log.data.script;
  if (log.type === "receive") {
    const r = log.data.result ?? "undefined";
    const s = String(r);
    return `结果: ${s.substring(0, 100)}${s.length > 100 ? "..." : ""}`;
  }
  return String(log.data);
}

onMounted(() => {
  setLogCallback((type, data) => {
    logs.value = [...logs.value.slice(-49), { type, data, time: new Date() }];
  });
});

onUnmounted(() => {
  setLogCallback(null);
});

declare const __DEBUG__: boolean;
</script>

<style scoped>
.debug-toggle {
  position: fixed;
  bottom: 38px;
  right: 12px;
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #888;
  z-index: 50;
}

.debug-toggle > * + * {
  margin-left: 8px;
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

.debug-panel {
  position: fixed;
  bottom: 62px;
  right: 12px;
  left: 12px;
  max-height: 200px;
  background: #1a1d23;
  border: 1px solid var(--border);
  border-radius: 8px;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #232730;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.debug-logs {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  line-height: 1.5;
}

.debug-log-entry {
  margin-bottom: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  background: #232730;
}

.debug-log-entry.send {
  border-left: 2px solid #0d6efd;
}

.debug-log-entry.receive {
  border-left: 2px solid #28a745;
}

.debug-log-entry.error {
  border-left: 2px solid #dc3545;
}

.debug-log-time {
  color: #666;
  font-size: 9px;
}

.debug-log-type {
  font-weight: bold;
  margin-right: 6px;
}

.debug-log-entry.send .debug-log-type {
  color: #0d6efd;
}

.debug-log-entry.receive .debug-log-type {
  color: #28a745;
}

.debug-log-entry.error .debug-log-type {
  color: #dc3545;
}

.debug-log-content {
  color: #d1d6df;
  word-break: break-all;
}

.debug-log-duration {
  color: #888;
  font-size: 9px;
  margin-left: 6px;
}
</style>
