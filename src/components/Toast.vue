<template>
  <div id="toastContainer">
    <div
      v-for="t in toasts"
      :key="t.id"
      :class="['toast', t.isError ? 'error' : 'success']"
    >
      {{ t.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from "vue";

interface ToastItem {
  id: number;
  message: string;
  isError: boolean;
}

const toasts = ref<ToastItem[]>([]);
let nextId = 0;

function showToast(message: string, isError = false) {
  const id = nextId++;
  toasts.value.push({ id, message, isError });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 2300);
}

provide("showToast", showToast);
defineExpose({ showToast });
</script>

<style scoped>
#toastContainer {
  position: fixed;
  top: 8px;
  left: 12px;
  right: 12px;
  z-index: 60;
  pointer-events: none;
}

.toast {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 12px;
  color: #fff;
  background: rgba(58, 141, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: toastFadeIn 0.3s ease-out;
  margin-bottom: 4px;
}

.toast.success {
  background: rgba(63, 185, 80, 0.95);
}

.toast.error {
  background: rgba(248, 81, 73, 0.95);
}

@keyframes toastFadeIn {
  from { opacity: 0; transform: translateY(-100%); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
