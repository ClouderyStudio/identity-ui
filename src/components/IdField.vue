<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { IconClose, IconVisibility, IconVisibilityOff } from '@/icons'
import M3IconButton from '@/components/m3/M3IconButton.vue'

/**
 * 表单字段：MD3 filled text field。
 *
 * MD3 的填充式输入框要点：
 *   - 容器 56dp 高，顶角 4dp、底角 0，底色是 surface-container-highest；
 *   - 标签在空且未聚焦时占据正文位置，聚焦或有值后缩到上方的「浮动标签」；
 *   - 底部一条 1dp 的 outline 指示线，聚焦时变 2dp 主色（不是整圈发光）；
 *   - 错误态换成 error 角色，同时用 aria-invalid + aria-describedby 表达给读屏。
 *
 * 无障碍：label 通过 for/id 绑定；提示与错误共用一个支持文本区，二选一。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'search' | 'url' | 'number'
    placeholder?: string
    /** 必填标记（只影响视觉与 aria-required）。 */
    required?: boolean
    /** 错误文案；非空时输入框转成错误态。 */
    error?: string
    /** 提示文案（错误为空时显示）。 */
    hint?: string
    autocomplete?: string
    disabled?: boolean
    readonly?: boolean
    /** 输入框右侧的主操作（如「发送验证码」）。 */
    actionText?: string
    /** 右侧主操作是否禁用（例如倒计时中）。 */
    actionDisabled?: boolean
    /** 右侧主操作是否处于加载态。 */
    actionLoading?: boolean
    /** 密码可见切换。 */
    revealable?: boolean
    /** 允许一键清空（搜索框用）。 */
    clearable?: boolean
    inputmode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'search' | 'url' | 'none'
    /** 前缀图标（金额、昵称等场景）。 */
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

const fieldId = useId()
const describedBy = computed(() => {
  if (props.error) return fieldId + '-error'
  if (props.hint) return fieldId + '-hint'
  return undefined
})

const focused = ref(false)
const revealed = ref(false)

const actualType = computed(() => {
  if (props.type !== 'password') return props.type
  return revealed.value ? 'text' : 'password'
})

/** 标签是否上浮：聚焦、有值、或者有占位符（占位符不能和标签叠在一起）。 */
const floating = computed(
  () => focused.value || props.modelValue.length > 0 || Boolean(props.placeholder),
)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function onFocus() {
  focused.value = true
  emit('focus')
}

function onBlur() {
  focused.value = false
  emit('blur')
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div
    class="field"
    :class="{
      'is-floating': floating,
      'is-focused': focused,
      'is-invalid': !!error,
      'is-disabled': disabled,
      'has-trailing': actionText || revealable || clearable,
    }"
  >
    <div class="field__container">
      <label class="field__label" :for="fieldId">
        {{ label }}<span v-if="required" class="field__required" aria-hidden="true">*</span>
        <span v-if="required" class="sr-only">（必填）</span>
      </label>

      <input
        :id="fieldId"
        class="field__input"
        :name="name"
        :type="actualType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :readonly="readonly"
        :inputmode="inputmode"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />

      <div v-if="actionText || revealable || clearable" class="field__trailing">
        <M3IconButton
          v-if="clearable && modelValue"
          :icon="IconClose"
          label="清空"
          size="sm"
          @click="clear"
        />
        <M3IconButton
          v-if="revealable && type === 'password'"
          :icon="revealed ? IconVisibilityOff : IconVisibility"
          :label="revealed ? '隐藏密码' : '显示密码'"
          :selected="revealed"
          size="sm"
          @click="revealed = !revealed"
        />
        <button
          v-if="actionText"
          class="field__action"
          type="button"
          :disabled="actionDisabled || disabled || actionLoading"
          @click="emit('action')"
        >
          <span v-if="actionLoading" class="field__spinner" aria-hidden="true" />
          {{ actionText }}
        </button>
      </div>
    </div>

    <div class="field__indicator" />

    <p v-if="error" :id="fieldId + '-error'" class="field__support field__support--error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="fieldId + '-hint'" class="field__support">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
}

.field__container {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 56px;
  padding-inline: 16px;
  border-start-start-radius: var(--md-sys-shape-corner-extra-small);
  border-start-end-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-highest);
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

@media (hover: hover) {
  .field__container:hover {
    background-color: color-mix(
      in srgb,
      var(--md-sys-color-on-surface) 6%,
      var(--md-sys-color-surface-container-highest)
    );
  }
}

.field__label {
  position: absolute;
  inset-inline-start: 16px;
  inset-block-start: 50%;
  translate: 0 -50%;
  max-width: calc(100% - 32px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  pointer-events: none;
  transform-origin: start center;
  transition:
    translate var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    font-size var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.field.is-floating .field__label {
  translate: 0 -22px;
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.field.is-focused .field__label {
  color: var(--md-sys-color-primary);
}

.field.has-trailing .field__label {
  max-width: calc(100% - 120px);
}

.field__input {
  width: 100%;
  padding: 0;
  padding-block-start: 16px;
  border: none;
  background: none;
  outline: none;
  color: var(--md-sys-color-on-surface);
  font-family: inherit;
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  caret-color: var(--md-sys-color-primary);
}

.field__input::placeholder {
  color: transparent;
  transition: color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.field.is-floating .field__input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}

.field__input:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.field__trailing {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-inline-end: -8px;
  flex-shrink: 0;
}

.field__action {
  height: 32px;
  padding-inline: 12px;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background: none;
  color: var(--md-sys-color-primary);
  font-family: inherit;
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-label-medium-weight);
  letter-spacing: var(--md-sys-typescale-label-medium-tracking);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

@media (hover: hover) {
  .field__action:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
  }
}

.field__action:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.field__spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-inline-end: 6px;
  vertical-align: -2px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--md-sys-shape-corner-full);
  animation: field-spin 640ms linear infinite;
}

@keyframes field-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 底部指示线：1dp 常态、2dp 聚焦、错误态用 error 角色 */
.field__indicator {
  height: 1px;
  margin-inline: 16px;
  background-color: var(--md-sys-color-on-surface-variant);
  transition:
    height var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    margin-inline var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.field.is-focused .field__indicator {
  height: 2px;
  margin-inline: 0;
  background-color: var(--md-sys-color-primary);
}

.field.is-invalid .field__indicator {
  height: 2px;
  margin-inline: 0;
  background-color: var(--md-sys-color-error);
}

.field__support {
  margin: 0;
  padding: 4px 16px 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.field__support--error {
  color: var(--md-sys-color-error);
}

.field.is-disabled .field__container {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent);
}

.field.is-disabled .field__indicator {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .field__spinner {
    animation-duration: 1400ms;
  }
}
</style>
