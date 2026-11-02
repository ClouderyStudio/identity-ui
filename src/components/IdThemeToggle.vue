<script setup lang="ts">
import { computed } from 'vue'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

/** 主题切换：深色 / 浅色 / 跟随系统三态。 */
const { mode, setMode } = useTheme()

const options: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
  { value: 'system', label: '跟随系统', icon: 'auto' },
]

const current = computed(() => options.find((option) => option.value === mode.value) ?? options[1]!)
</script>

<template>
  <div class="id-theme-toggle" role="group" aria-label="主题">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="id-theme-toggle__btn"
      :class="{ 'is-active': mode === option.value }"
      :aria-pressed="mode === option.value"
      :title="option.label"
      @click="setMode(option.value)"
    >
      <svg v-if="option.icon === 'sun'" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke-linecap="round" />
      </svg>
      <svg v-else-if="option.icon === 'moon'" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" stroke-linejoin="round" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <rect x="2.5" y="4" width="19" height="13" rx="2" />
        <path d="M9 21h6M12 17v4" stroke-linecap="round" />
      </svg>
      <span class="id-sr-only">{{ option.label }}</span>
    </button>
    <span class="id-sr-only">当前主题：{{ current.label }}</span>
  </div>
</template>

<style scoped>
.id-theme-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--id-radius-control);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
}

.id-theme-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 24px;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: var(--id-text-muted);
  cursor: pointer;
  transition: background-color var(--id-transition), color var(--id-transition);
}

.id-theme-toggle__btn:hover {
  color: var(--id-text);
}

.id-theme-toggle__btn.is-active {
  background: var(--id-surface-strong);
  color: var(--id-text);
}
</style>