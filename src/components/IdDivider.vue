<script setup lang="ts">
/** 分隔线：可带居中文字（「或使用第三方登录」）。 */
withDefaults(defineProps<{ label?: string }>(), { label: '' })
</script>

<template>
  <div class="id-divider" role="separator" :aria-label="label || undefined">
    <span v-if="label" class="id-divider__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.id-divider {
  display: flex;
  align-items: center;
  gap: var(--id-space-3);
  margin: var(--id-space-5) 0;
  color: var(--id-text-faint);
  font-size: var(--id-font-small);
}

/* 没有文字时就是一条线 */
.id-divider:not(:has(.id-divider__label)) {
  height: 1px;
  background: var(--id-border);
}

.id-divider:has(.id-divider__label)::before,
.id-divider:has(.id-divider__label)::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--id-border);
}

.id-divider__label {
  white-space: nowrap;
}
</style>
