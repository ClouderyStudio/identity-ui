<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { computed, reactive, ref } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import { identityApi, isApiError } from '@/api/client'

/**
 * 改密页。对应 POST /identity/account/password（P2 落地，需登录）。
 *
 * 已经用第三方账号登录、或 Casdoor 存量账号还没设本地密码时，后端会回
 * 「该账号没有本地密码，无法在此设置」——这个提示原样展示，不改成含糊的说法。
 */
const form = reactive({ current: '', next: '', confirm: '' })
const errors = reactive({ current: '', next: '', confirm: '' })
const submitting = ref(false)
const formError = ref('')
const success = ref(false)

const strength = computed(() => {
  const value = form.next
  if (!value) return { level: 0, label: '' }
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^\w]/.test(value)) score += 1
  const level = Math.min(3, Math.ceil(score / 2))
  return { level, label: ['', '偏弱', '一般', '较强'][level] ?? '' }
})

function validate(): boolean {
  errors.current = form.current ? '' : '请输入当前密码'
  errors.next = form.next.length >= 8 ? '' : '新密码至少 8 位'
  errors.confirm = form.confirm === form.next ? '' : '两次输入的密码不一致'
  if (form.next && form.next === form.current) errors.next = '新密码不能与当前密码相同'
  return !errors.current && !errors.next && !errors.confirm
}

async function submit() {
  formError.value = ''
  success.value = false
  if (!validate()) return

  submitting.value = true
  try {
    await identityApi.changePassword({ currentPassword: form.current, newPassword: form.next })
    success.value = true
    form.current = ''
    form.next = ''
    form.confirm = ''
  } catch (error) {
    formError.value = isApiError(error) ? error.detail : '网络异常，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <RouterLink class="id-back" to="/account">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          返回账户面板
        </RouterLink>
        <h1 class="id-card-title">修改密码</h1>
        <p class="id-card-subtitle">修改后其它设备上的登录状态不会立即失效</p>
      </template>

      <IdAlert v-if="success" variant="success" title="密码已修改">
        下次登录请使用新密码。
      </IdAlert>

      <form class="id-form" novalidate @submit.prevent="submit">
        <IdField
          v-model="form.current"
          label="当前密码"
          type="password"
          autocomplete="current-password"
          revealable
          required
          :error="errors.current"
        />
        <div class="id-strength-block">
          <IdField
            v-model="form.next"
            label="新密码"
            type="password"
            autocomplete="new-password"
            revealable
            required
            :error="errors.next"
            hint="至少 8 位，建议混合大小写与符号"
          />
          <div v-if="form.next" class="id-strength" :data-level="strength.level">
            <span v-for="step in 3" :key="step" class="id-strength__bar" :class="{ 'is-on': step <= strength.level }" />
            <span class="id-strength__label">{{ strength.label }}</span>
          </div>
        </div>
        <IdField
          v-model="form.confirm"
          label="确认新密码"
          type="password"
          autocomplete="new-password"
          revealable
          required
          :error="errors.confirm"
        />

        <IdAlert v-if="formError" variant="error">{{ formError }}</IdAlert>

        <IdButton type="submit" block :loading="submitting">保存新密码</IdButton>
      </form>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.id-card-title {
  font-size: var(--id-font-subtitle);
  font-weight: 600;
  color: var(--id-text);
}

.id-card-subtitle {
  margin-top: var(--id-space-2);
  font-size: var(--id-font-body);
  color: var(--id-text-muted);
}

.id-form {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-4);
  margin-top: var(--id-space-5);
}

.id-strength-block {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
}

.id-strength {
  display: flex;
  align-items: center;
  gap: var(--id-space-1);
}

.id-strength__bar {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--id-border);
  transition: background-color var(--id-transition);
}

.id-strength[data-level='1'] .id-strength__bar.is-on {
  background: var(--id-danger);
}

.id-strength[data-level='2'] .id-strength__bar.is-on {
  background: var(--id-warning);
}

.id-strength[data-level='3'] .id-strength__bar.is-on {
  background: var(--id-success);
}

.id-strength__label {
  min-width: 2.5em;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
  text-align: right;
}
</style>