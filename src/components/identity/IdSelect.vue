<script setup lang="ts">
import { computed, useId } from 'vue'
import { IconExpandMore } from '@/icons'
import { M3Icon } from '@cloudery/m3-ui'

/**
 * 下拉选择：MD3 filled select。
 *
 * MD3 的规范里 select 用的是和文本框同一套填充容器；官方组件库里没有现成实现，
 * 所以这里用原生 <select>（键盘、读屏、移动端原生选择器全部现成）套上 M3 皮肤，
 * 而不是自己拿 popup 重造一遍。
 */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    options: SelectOption[]
    /** 空值选项的文案（传空串表示不提供空选项）。 */
    placeholder?: string
    disabled?: boolean
    required?: boolean
    hint?: string
    error?: string
  }>(),
  { placeholder: '', disabled: false, required: false, hint: '', error: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = useId()
const describedBy = computed(() => {
  if (props.error) return fieldId + '-error'
  if (props.hint) return fieldId + '-hint'
  return undefined
})

const empty = computed(() => props.modelValue === '')
</script>

<template>
  <div class="select-field" :class="{ 'is-empty': empty, 'is-invalid': !!error, 'is-disabled': disabled }">
    <div class="select-field__container">
      <label class="select-field__label" :for="fieldId">{{ label }}</label>

      <select
        :id="fieldId"
        class="select-field__control"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <M3Icon :icon="IconExpandMore" :size="22" class="select-field__chevron" />
    </div>

    <div class="select-field__indicator" />

    <p v-if="error" :id="fieldId + '-error'" class="select-field__support select-field__support--error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="fieldId + '-hint'" class="select-field__support">{{ hint }}</p>
  </div>
</template>

<style scoped>
.select-field {
  display: flex;
  flex-direction: column;
}

.select-field__container {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 56px;
  padding-inline: 16px;
  border-start-start-radius: var(--md-sys-shape-corner-extra-small);
  border-start-end-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-highest);
}

.select-field__label {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-start: 16px;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
  pointer-events: none;
}

.select-field__control {
  width: 100%;
  height: 32px;
  margin-block-end: 6px;
  padding: 0 32px 0 0;
  border: none;
  background: none;
  outline: none;
  appearance: none;
  color: var(--md-sys-color-on-surface);
  font-family: inherit;
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  cursor: pointer;
}

.select-field.is-empty .select-field__control {
  color: var(--md-sys-color-on-surface-variant);
}

.select-field__control:disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.select-field__chevron {
  position: absolute;
  inset-inline-end: 12px;
  inset-block-end: 12px;
  color: var(--md-sys-color-on-surface-variant);
  pointer-events: none;
}

.select-field__indicator {
  height: 1px;
  margin-inline: 16px;
  background-color: var(--md-sys-color-on-surface-variant);
  transition:
    height var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    margin-inline var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.select-field__container:focus-within + .select-field__indicator {
  height: 2px;
  margin-inline: 0;
  background-color: var(--md-sys-color-primary);
}

.select-field.is-invalid .select-field__indicator {
  height: 2px;
  margin-inline: 0;
  background-color: var(--md-sys-color-error);
}

.select-field__support {
  margin: 0;
  padding: 4px 16px 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
}

.select-field__support--error {
  color: var(--md-sys-color-error);
}

.select-field.is-disabled .select-field__container {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent);
}
</style>
