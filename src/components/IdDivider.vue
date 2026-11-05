<script setup lang="ts">
/**
 * 分隔线：MD3 divider + 可选中缝文字（「或使用第三方账号」）。
 *
 * 有文字时两端各一条 1dp 的 outline-variant 线；没有文字就是一条普通分割线。
 */
withDefaults(
  defineProps<{
    label?: string
    inset?: 'none' | 'inset'
  }>(),
  { label: '', inset: 'none' },
)
</script>

<template>
  <div
    class="divider"
    :class="['divider--' + (label ? 'labelled' : 'plain'), 'divider--' + inset]"
    role="separator"
    :aria-label="label || undefined"
  >
    <span v-if="label" class="divider__label md-typescale-body-small">{{ label }}</span>
  </div>
</template>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-block: 20px;
}

.divider--plain {
  height: 1px;
  background-color: var(--md-sys-color-outline-variant);
}

.divider--labelled::before,
.divider--labelled::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--md-sys-color-outline-variant);
}

.divider--inset {
  margin-inline: 16px;
}

.divider__label {
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}
</style>
