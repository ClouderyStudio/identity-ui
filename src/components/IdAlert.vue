<script setup lang="ts">
/**
 * 行内提示：error / success / info / warning。
 * role 按级别区分：错误用 alert（立即播报），其余用 status（礼貌播报）。
 */
withDefaults(
  defineProps<{
    variant?: 'error' | 'success' | 'info' | 'warning'
    /** 标题；不传时只有正文。 */
    title?: string
  }>(),
  { variant: 'info', title: '' },
)
</script>

<template>
  <div
    class="id-alert"
    :class="`id-alert--${variant}`"
    :role="variant === 'error' ? 'alert' : 'status'"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
  >
    <span class="id-alert__icon" aria-hidden="true">
      <svg v-if="variant === 'error'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" stroke-linecap="round" />
      </svg>
      <svg v-else-if="variant === 'success'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 9.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <svg v-else-if="variant === 'warning'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3l9.5 17h-19L12 3z" stroke-linejoin="round" />
        <path d="M12 9v5M12 17v.5" stroke-linecap="round" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7.5v.5" stroke-linecap="round" />
      </svg>
    </span>
    <div class="id-alert__content">
      <p v-if="title" class="id-alert__title">{{ title }}</p>
      <div class="id-alert__body"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.id-alert {
  display: flex;
  gap: var(--id-space-3);
  padding: var(--id-space-3) var(--id-space-4);
  border-radius: var(--id-radius-field);
  border: 1px solid transparent;
  font-size: var(--id-font-small);
  line-height: 1.55;
}

.id-alert__icon {
  display: inline-flex;
  align-items: flex-start;
  padding-top: 2px;
}

.id-alert__content {
  min-width: 0;
}

.id-alert__title {
  font-weight: 600;
  margin-bottom: 2px;
}

.id-alert--error {
  background: var(--id-danger-soft);
  border-color: color-mix(in srgb, var(--id-danger) 34%, transparent);
  color: var(--id-danger);
}

.id-alert--success {
  background: var(--id-success-soft);
  border-color: color-mix(in srgb, var(--id-success) 34%, transparent);
  color: var(--id-success);
}

.id-alert--warning {
  background: var(--id-warning-soft);
  border-color: color-mix(in srgb, var(--id-warning) 34%, transparent);
  color: var(--id-warning);
}

.id-alert--info {
  background: var(--id-accent-soft);
  border-color: color-mix(in srgb, var(--id-accent) 30%, transparent);
  color: var(--id-text-body);
}
</style>
