<template>
  <div :class="['status-bar', isError ? 'error' : 'success']">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string; isError?: boolean }>();
</script>

<style scoped>
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: #1c1f25;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
  z-index: 40;
}

.status-bar.success {
  color: var(--success);
}

.status-bar.error {
  color: var(--error);
}
</style>
