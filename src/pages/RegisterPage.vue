<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import { identityApi, isApiError } from '@/api/client'

/**
 * 注册页。字段与后端 POST /identity/account/register 一一对应。
 *
 * 密码强度只在**长度**上做硬校验（后端 LocalAccountService.MinPasswordLength = 8），
 * 复杂度规则在手机输入法下误伤太大，前端不额外发明。
 */
withDefaults(defineProps<{ minPasswordLength?: number }>(), { minPasswordLength: 8 })


const form = reactive({ username: '', email: '', code: '', password: '', confirm: '' })
const errors = reactive({ username: '', email: '', code: '', password: '', confirm: '' })
const submitting = ref(false)
const formError = ref('')
const done = ref(false)

const passwordMismatch = computed(
  () => form.confirm.length > 0 && form.password !== form.confirm,
)

// 邮箱验证码：后端尚未提供发码接口（MHOP 的验证码与本域账号是两套），
// 所以这里只做倒计时与输入校验；接上接口后把 sendCode 里的注释替换掉即可。
const countdown = ref(0)
const sending = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

async function sendCode() {
  if (countdown.value > 0 || sending.value) return
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = '请先填写有效的邮箱地址'
    return
  }

  errors.email = ''
  formError.value = ''
  sending.value = true
  try {
    await identityApi.sendEmailCode({ email: form.email.trim().toLowerCase(), purpose: 'register' })
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && timer) clearInterval(timer)
    }, 1000)
  } catch (error) {
    formError.value = isApiError(error) ? error.detail : '发送失败，请稍后重试'
  } finally {
    sending.value = false
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function validate(): boolean {
  errors.username = form.username.trim() ? '' : '请输入账户名'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? '' : '请输入有效的邮箱地址'
  errors.code = /^\d{6}$/.test(form.code.trim()) ? '' : '请输入 6 位验证码'
  errors.password =
    form.password.length >= 8 ? '' : `密码至少 ${{ minPasswordLength: 8 }.minPasswordLength} 位`
  errors.confirm = form.confirm === form.password ? '' : '两次输入的密码不一致'
  return !errors.username && !errors.email && !errors.code && !errors.password && !errors.confirm
}

async function submit() {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await identityApi.register({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      code: form.code.trim(),
      password: form.password,
    })
    done.value = true
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
        <RouterLink class="id-back" to="/login">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          返回登录
        </RouterLink>
        <h1 class="id-card-title">注册账号</h1>
        <p class="id-card-subtitle">创建云术账户，一处登录，全站通用</p>
      </template>

      <IdAlert v-if="done" variant="success" title="注册成功">
        账号已创建，请使用新密码登录。
        <RouterLink class="id-link" to="/login">立即登录</RouterLink>
      </IdAlert>

      <form v-else class="id-form" novalidate @submit.prevent="submit">
        <IdField
          v-model="form.username"
          label="账户名"
          placeholder="账户名"
          autocomplete="username"
          required
          :error="errors.username"
        />
        <IdField
          v-model="form.email"
          label="邮箱"
          type="email"
          inputmode="email"
          placeholder="example@example.com"
          autocomplete="email"
          required
          hint="用于找回密码，请填写常用邮箱"
          :error="errors.email"
        />
        <IdField
          v-model="form.code"
          label="验证码"
          placeholder="6 位验证码"
          inputmode="numeric"
          autocomplete="one-time-code"
          required
          :action-text="countdown > 0 ? `${countdown} 秒后重发` : '发送验证码'"
          :action-disabled="countdown > 0 || sending"
          :error="errors.code"
          @action="sendCode"
        />
        <IdField
          v-model="form.password"
          label="密码"
          type="password"
          placeholder="密码"
          autocomplete="new-password"
          revealable
          required
          :hint="`至少 ${minPasswordLength} 位`"
          :error="errors.password"
        />
        <IdField
          v-model="form.confirm"
          label="确认密码"
          type="password"
          placeholder="确认密码"
          autocomplete="new-password"
          revealable
          required
          :error="errors.confirm || (passwordMismatch ? '两次输入的密码不一致' : '')"
        />

        <IdAlert v-if="formError" variant="error">{{ formError }}</IdAlert>

        <IdButton type="submit" block :loading="submitting">注册</IdButton>

        <p class="id-legal">
          注册即代表你同意我们的
          <a href="/terms">服务条款</a>
          与
          <a href="/privacy">隐私策略</a>
          。
        </p>
      </form>

      <template #footer>
        已有账号？<RouterLink class="id-link" to="/login">直接登录</RouterLink>
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.id-back {
  display: inline-flex;
  align-items: center;
  gap: var(--id-space-1);
  margin-bottom: var(--id-space-3);
  padding: 0;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
  background: none;
  border: none;
  cursor: pointer;
}

.id-back:hover {
  color: var(--id-text);
}

.id-card-title {
  font-size: var(--id-font-title);
  font-weight: 600;
  color: var(--id-text);
  line-height: 1.25;
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

.id-legal {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
  line-height: 1.6;
}

.id-link {
  padding: 0;
  font-size: var(--id-font-small);
  color: var(--id-accent);
  background: none;
  border: none;
  cursor: pointer;
}
</style>