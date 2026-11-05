<script setup lang="ts">
import { computed } from 'vue'

/**
 * 口令强度条。
 *
 * 只做「提示」，不做校验：后端才是权威（LocalAccountService.MinPasswordLength）。
 * 打分口径与后端保持一致的部分只有长度，其余（大小写 / 数字 / 符号）是建议。
 */
const props = withDefaults(
  defineProps<{
    value: string
    /** 后端要求的最短长度。 */
    minLength?: number
  }>(),
  { minLength: 8 },
)

const score = computed(() => {
  const value = props.value
  if (!value) return 0
  let points = 0
  if (value.length >= props.minLength) points += 1
  if (value.length >= props.minLength + 4) points += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points += 1
  if (/\d/.test(value)) points += 1
  if (/[^\w]/.test(value)) points += 1
  return points
})

const level = computed(() => {
  if (!props.value) return 0
  if (props.value.length < props.minLength) return 1
  return Math.min(4, Math.max(1, Math.ceil(score.value / 1.5)))
})

const label = computed(() => ['', '太短', '尚可', '不错', '很强'][level.value] ?? '')
</script>

<template>
  <div
    class="strength"
    :class="'strength--' + level"
    role="meter"
    :aria-valuemin="0"
    :aria-valuemax="4"
    :aria-valuenow="level"
    :aria-label="'口令强度：' + (label || '未填写')"
  >
    <div class="strength__bars" aria-hidden="true">
      <span v-for="step in 4" :key="step" class="strength__bar" :class="{ 'is-on': step <= level }" />
    </div>
    <p class="strength__label md-typescale-body-small">{{ label }}</p>
  </div>
</template>

<style scoped>
.strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-block-start: 8px;
}

.strength__bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength__bar {
  flex: 1;
  height: 4px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  transition: background-color var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard);
}

.strength--1 .strength__bar.is-on {
  background-color: var(--md-sys-color-error);
}

.strength--2 .strength__bar.is-on {
  background-color: var(--md-sys-color-tertiary);
}

.strength--3 .strength__bar.is-on,
.strength--4 .strength__bar.is-on {
  background-color: var(--md-sys-color-primary);
}

.strength__label {
  min-width: 3em;
  margin: 0;
  text-align: end;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
