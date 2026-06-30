<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div :class="['modal-card', small ? 'modal-card-sm' : '']">
      <div class="modal-title">{{ title }}</div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-actions">
        <button class="btn" @click="$emit('close')">取消</button>
        <button v-if="confirmText" class="btn btn-primary" @click="$emit('confirm')">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  title: string;
  confirmText?: string;
  small?: boolean;
}>();
defineEmits(["close", "confirm"]);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: modalFadeIn 0.15s ease;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 320px;
  max-width: 90%;
  box-shadow: var(--shadow);
  animation: modalSlideIn 0.15s ease;
}

.modal-card-sm {
  width: 280px;
}

.modal-title {
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  border-bottom: 1px solid var(--border);
}

.modal-body {
  padding: 16px;
}

.modal-body > :deep(* + *) {
  margin-top: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.modal-actions > * + * {
  margin-left: 8px;
}
</style>
