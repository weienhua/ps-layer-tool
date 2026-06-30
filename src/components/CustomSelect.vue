<template>
  <div :class="['custom-select', { open }]" ref="wrapperRef">
    <div
      class="custom-select-trigger"
      tabindex="0"
      @click.stop="open = !open"
      @keydown.enter.prevent="open = !open"
      @keydown.space.prevent="open = !open"
      @keydown.arrow-down.prevent="open = true"
    >
      <span class="select-value">{{ selectedLabel }}</span>
      <span class="select-arrow">▼</span>
    </div>
    <div class="custom-select-dropdown">
      <div
        v-for="opt in options"
        :key="opt.value"
        :class="['custom-select-option', { selected: opt.value === modelValue }]"
        @click.stop="select(opt.value)"
      >
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  modelValue: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
}>();
const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const wrapperRef = ref<HTMLDivElement>();

const selectedLabel = computed(() => {
  const found = props.options.find((o: { label: string; value: string }) => o.value === props.modelValue);
  return found?.label || props.placeholder || "请选择";
});

function select(value: string) {
  emit("update:modelValue", value);
  open.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<style scoped>
.custom-select {
  position: relative;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  padding: 8px 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-main);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.custom-select-trigger .select-value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.custom-select-trigger:hover {
  background: var(--bg-input-focus);
}

.custom-select-trigger:focus-visible {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(58, 141, 255, 0.25);
}

.custom-select-trigger .select-arrow {
  flex-shrink: 0;
  margin-left: 8px;
  color: var(--text-muted);
  transition: transform 0.15s ease;
}

.custom-select.open .custom-select-trigger .select-arrow {
  transform: rotate(180deg);
}

.custom-select.open .custom-select-trigger {
  border-color: var(--primary);
  background: var(--bg-input-focus);
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  box-shadow: var(--shadow);
  z-index: 100;
  display: none;
}

.custom-select.open .custom-select-dropdown {
  display: block;
}

.custom-select-option {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  font-size: 11px;
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}

.custom-select-option::-webkit-scrollbar {
  display: none;
}

.custom-select-option:hover {
  background: var(--bg-card-hover);
}

.custom-select-option.selected {
  background: var(--primary);
  color: #fff;
}

.custom-select-option:focus-visible {
  outline: none;
  background: var(--bg-card-hover);
}
</style>
