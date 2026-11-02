<script setup lang="ts">
import { computed, ref, useId } from 'vue'

/**
 * 表单字段：标签 + 输入框 + 错误/提示 + 可选的后置按钮（发送验证码、显示口令）。
 *
 * 无障碍：label 通过 for/id 绑定；错误用 aria-describedby 关联，并同时给
 * aria-invalid，读屏用户能听到「该字段有误」而不是只看到红边。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    type?: 'text' | 'email' | 'password' | 'tel'
    placeholder?: string
    /** 必填标记（只影响视觉与 aria-required）。 */
    required?: boolean
    /** 错误文案；非空时输入框转成错误态。 */
    error?: string
    /** 提示文案（错误为空时显示）。 */
    hint?: string
    autocomplete?: string
    disabled?: boolean
    /** 输入框右侧按钮文案（如「发送验证码」）。 */
    actionText?: string
    /** 右侧按钮是否禁用（如倒计时中）。 */
    actionDisabled?: boolean
    /** 口令可见切换。 */
    revealable?: boolean
    inputmode?: 'text' | 'email' | 'tel' | 'numeric'
  }>(),
  {
    type: 'text',
    placeholder: '',
    required: false,
    error: '',
    hint: '',
    autocomplete: 'off',
    disabled: false,
    actionText: '',
    actionDisabled: false,
    revealable: false,
    inputmode: 'text',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  action: []
  blur: []
}>()

const fieldId = useId()
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.error) ids.push(`${fieldId}-error`)
  else if (props.hint) ids.push(`${fieldId}-hint`)
  return ids.length ? ids.join(' ') : undefined
})

const revealed = ref(false)
const actualType = computed(() => {
  if (props.type !== 'password') return props.type
  return revealed.value ? 'text' : 'password'
})

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="id-field" :class="{ 'id-field--invalid': !!error, 'id-field--disabled': disabled }">
    <label class="id-field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="id-field__required" aria-hidden="true">*</span>
      <span v-if="required" class="id-sr-only">（必填）</span>
    </label>

    <div class="id-field__control">
      <input
        :id="fieldId"
        class="id-field__input"
        :type="actualType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :inputmode="inputmode"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @input="onInput"
        @blur="emit('blur')"
      />

      <button
        v-if="actionText"
        class="id-field__action"
        type="button"
        :disabled="actionDisabled || disabled"
        @click="emit('action')"
      >
        {{ actionText }}
      </button>

      <button
        v-else-if="revealable && type === 'password'"
        class="id-field__action id-field__action--icon"
        type="button"
        :aria-label="revealed ? '隐藏口令' : '显示口令'"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <svg v-if="revealed" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" stroke-linecap="round" />
          <path d="M6.7 6.7C4.6 8.1 3 10 2 12c2 4 5.5 7 10 7 1.9 0 3.6-.5 5.1-1.4M17.9 17.9" stroke-linecap="round" />
          <path d="M14.5 5.4A9.9 9.9 0 0112 5c4.5 0 8 3 10 7-.6 1.2-1.4 2.3-2.3 3.2" stroke-linecap="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M2 12c2-4 5.5-7 10-7s8 3 10 7c-2 4-5.5 7-10 7S4 16 2 12z" stroke-linejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>

    <p v-if="error" :id="`${fieldId}-error`" class="id-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${fieldId}-hint`" class="id-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.id-field {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
}

.id-field__label {
  font-size: var(--id-font-small);
  font-weight: 600;
  color: var(--id-text-body);
  letter-spacing: 0.02em;
}

.id-field__required {
  margin-left: 2px;
  color: var(--id-danger);
}

.id-field__control {
  position: relative;
  display: flex;
  align-items: center;
}

.id-field__input {
  width: 100%;
  height: var(--id-control-height);
  padding: 0 var(--id-space-3);
  font-size: var(--id-font-body);
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  /* Fluent 输入框：4px 圆角 + 聚焦时底部强调线 */
  border-radius: var(--id-radius-field);
  border-bottom-color: var(--id-text-muted);
  outline: none;
  transition: border-color var(--id-transition), background-color var(--id-transition),
    box-shadow var(--id-transition);
}

.id-field__input::placeholder {
  color: var(--id-text-faint);
}

.id-field__input:hover:not(:disabled) {
  border-color: var(--id-border-strong);
}

.id-field__input:hover:not(:disabled) {
  background: var(--id-surface-hover);
}

.id-field__input:focus-visible,
.id-field__input:focus {
  background: var(--id-surface-strong);
  border-color: var(--id-border);
  /* Fluent 的聚焦表现是底部一条品牌色线，不是整圈发光 */
  border-bottom: 2px solid var(--id-accent);
  padding-bottom: 0;
  outline: none;
}

.id-field__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 右侧有按钮时给输入框留出位置，避免文字被按钮压住（按按钮类型区分留白宽度） */
.id-field__control:has(.id-field__action) > .id-field__input {
  padding-right: 120px;
}

.id-field__control:has(.id-field__action--icon) > .id-field__input {
  padding-right: 48px;
}

.id-field__action {
  position: absolute;
  right: var(--id-space-2);
  height: calc(var(--id-control-height) - 12px);
  padding: 0 var(--id-space-3);
  font-size: var(--id-font-small);
  font-weight: 600;
  color: var(--id-accent);
  background: transparent;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color var(--id-transition), color var(--id-transition);
}

.id-field__action:hover:not(:disabled) {
  background: var(--id-accent-soft);
}

.id-field__action:disabled {
  color: var(--id-text-faint);
  cursor: not-allowed;
}

.id-field__action--icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  padding: 0;
}

.id-field--invalid .id-field__input {
  border-color: var(--id-danger);
}

.id-field--invalid .id-field__input:focus {
  box-shadow: 0 0 0 3px var(--id-danger-soft);
}

.id-field__error {
  font-size: var(--id-font-small);
  color: var(--id-danger);
}

.id-field__hint {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}
</style>