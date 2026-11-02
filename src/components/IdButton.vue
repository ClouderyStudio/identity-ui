<script setup lang="ts">
/**
 * 按钮：primary（主操作）/ secondary（次要）/ ghost（链接式）。
 * 参考站的主按钮是低饱和浅蓝 + 深色文字；这里用 --id-accent / --id-on-accent 表达，
 * 浅色主题下自动变成深蓝底白字。
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    type?: 'button' | 'submit'
    disabled?: boolean
    /** 加载态：禁用交互并显示转圈，按钮宽度不变（避免布局跳动）。 */
    loading?: boolean
    /** 占满整行。 */
    block?: boolean
    size?: 'md' | 'sm'
  }>(),
  { variant: 'primary', type: 'button', disabled: false, loading: false, block: false, size: 'md' },
)
</script>

<template>
  <button
    :type="type"
    class="id-button"
    :class="[`id-button--${variant}`, { 'id-button--block': block, 'id-button--sm': size === 'sm' }]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="id-button__spinner" aria-hidden="true" />
    <span class="id-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.id-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--id-space-2);
  height: var(--id-control-height);
  padding: 0 var(--id-space-4);
  font-size: var(--id-font-body);
  font-weight: 600;
  /* Fluent 控件圆角是 4px，不用胶囊形 */
  border-radius: var(--id-radius-control);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color var(--id-transition), border-color var(--id-transition),
    color var(--id-transition), transform 80ms ease;
  user-select: none;
}

.id-button:active:not(:disabled) {
  transform: translateY(1px);
}

.id-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.id-button--block {
  width: 100%;
}

.id-button--sm {
  height: 28px;
  padding: 0 var(--id-space-3);
  font-size: var(--id-font-small);
}

.id-button--primary {
  background: var(--id-accent);
  color: var(--id-on-accent);
}

.id-button--primary:hover:not(:disabled) {
  background: var(--id-accent-strong);
}

.id-button--secondary {
  background: var(--id-surface-sunken);
  border-color: var(--id-border-strong);
  color: var(--id-text);
}

.id-button--secondary:hover:not(:disabled) {
  background: var(--id-surface-hover);
  border-color: var(--id-text-muted);
}

.id-button--ghost {
  background: transparent;
  color: var(--id-accent);
  padding: 0 var(--id-space-2);
  font-weight: 500;
}

.id-button--ghost:hover:not(:disabled) {
  background: var(--id-accent-soft);
}

.id-button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: id-spin 640ms linear infinite;
}

@keyframes id-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .id-button__spinner {
    animation-duration: 1600ms;
  }
}
</style>