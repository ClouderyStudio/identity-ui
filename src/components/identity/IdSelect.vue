<script setup lang="ts">
import { M3Select, type SelectOption } from '@clderystd/m3-ui'

/**
 * 下拉选择：MD3 filled select。
 *
 * 实现已上移到组件库（`M3Select`），用原生 <select> 套 M3 皮肤。
 * 这里保留薄壳只为不动既有调用点；**新代码请直接用 `M3Select`**。
 */
defineOptions({ inheritAttrs: false })

export type { SelectOption }

withDefaults(
  defineProps<{
    modelValue: string
    label: string
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    required?: boolean
    hint?: string
    error?: string
  }>(),
  { placeholder: '', disabled: false, required: false, hint: '', error: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <M3Select
    v-bind="$attrs"
    :model-value="modelValue"
    :label="label"
    :options="options"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :hint="hint"
    :error="error"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
