<script setup lang="ts">
import { M3TextField } from '@clderystd/m3-ui'

/**
 * 表单字段：MD3 filled text field。
 *
 * 实现已上移到组件库（`M3TextField`）——它不止身份中心在用，
 * SCForge 的上传表单、后台筛选栏都是同一个控件，各自维护一份必然走样。
 *
 * 这里保留薄壳只为不动 40 处既有调用点的 import 路径；**新代码请直接用 `M3TextField`**。
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'search' | 'url' | 'number'
    placeholder?: string
    required?: boolean
    error?: string
    hint?: string
    autocomplete?: string
    disabled?: boolean
    readonly?: boolean
    actionText?: string
    actionDisabled?: boolean
    actionLoading?: boolean
    revealable?: boolean
    clearable?: boolean
    inputmode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'search' | 'url' | 'none'
    name?: string
  }>(),
  {
    type: 'text',
    placeholder: '',
    required: false,
    error: '',
    hint: '',
    autocomplete: 'off',
    disabled: false,
    readonly: false,
    actionText: '',
    actionDisabled: false,
    actionLoading: false,
    revealable: false,
    clearable: false,
    inputmode: 'text',
    name: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  action: []
  blur: []
  focus: []
}>()

</script>

<template>
  <M3TextField
    v-bind="$attrs"
    :model-value="props.modelValue"
    :label="props.label"
    :type="props.type"
    :placeholder="props.placeholder"
    :required="props.required"
    :error="props.error"
    :hint="props.hint"
    :autocomplete="props.autocomplete"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :action-text="props.actionText"
    :action-disabled="props.actionDisabled"
    :action-loading="props.actionLoading"
    :revealable="props.revealable"
    :clearable="props.clearable"
    :inputmode="props.inputmode"
    :name="props.name as string | undefined"
    @update:model-value="emit('update:modelValue', $event)"
    @action="emit('action')"
    @blur="emit('blur')"
    @focus="emit('focus')"
  />
</template>
