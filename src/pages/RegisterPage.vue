<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'

import { IconArrowBack } from '@/icons'
import { M3Button, M3Icon } from '@clderystd/m3-ui'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import IdAuthNotice from '@/components/identity/IdAuthNotice.vue'
import IdStrengthMeter from '@/components/identity/IdStrengthMeter.vue'
import { identityApi, isApiError } from '@/api/client'
import IdAlert from '@/components/IdAlert.vue'
import { useToast } from '@/composables/useToast'
import IdNavButton from '@/components/identity/IdNavButton.vue'
import IdRouteLink from '@/components/identity/IdRouteLink.vue'

/**
 * 注册页。字段与后端 POST /identity/account/register 一一对应。
 *
 * 密码强度只在**长度**上做硬校验（后端 LocalAccountService.MinPasswordLength = 8），
 * 复杂度规则在手机输入法下误伤太大，前端不额外发明；强度条只是提示。
 */
const props = withDefaults(defineProps<{ minPasswordLength?: number }>(), { minPasswordLength: 8 })

// 认领模式：第三方回调带过来的注册请求（claim 是服务端暂存票据的键，只在这里用一次）。
// 这些常量必须在 form 之前声明——form 的初始值引用了它们。
const claimParams = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search)
  : new URLSearchParams()
const claimKey = claimParams.get('claim') ?? ''
const claimProvider = claimParams.get('provider') ?? ''
const claimName = claimParams.get('name') ?? ''
const claimEmail = claimParams.get('email') ?? ''
const isClaim = computed(() => claimKey.length > 0)

const form = reactive({
  username: claimName || '',
  email: claimEmail || '',
  code: '',
  password: '',
  confirm: '',
})

const errors = reactive({ username: '', email: '', code: '', password: '', confirm: '' })
const submitting = ref(false)
const toast = useToast()
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
  sending.value = true
  try {
    await identityApi.sendEmailCode({ email: form.email.trim().toLowerCase(), purpose: 'register' })
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && timer) clearInterval(timer)
    }, 1000)
  } catch (error) {
    toast.error(isApiError(error) ? error.detail : '发送失败，请稍后重试', '验证码未发送')
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
    form.password.length >= props.minPasswordLength
      ? ''
      : '密码至少 ' + props.minPasswordLength + ' 位'
  errors.confirm = form.confirm === form.password ? '' : '两次输入的密码不一致'
  return !errors.username && !errors.email && !errors.code && !errors.password && !errors.confirm
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  try {
    await identityApi.register({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      code: form.code.trim(),
      password: form.password,
      ...(isClaim.value ? { claimKey } : {}),
    })
    done.value = true
    if (isClaim.value) {
      // 认领注册已由服务端建立会话
      setTimeout(() => window.location.assign('/account'), 1200)
    }
  } catch (error) {
    toast.error(isApiError(error) ? error.detail : '网络异常，请稍后重试', '注册未完成')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <IdRouteLink class="back" to="/login">
          <M3Icon :icon="IconArrowBack" :size="18" />
          返回登录
        </IdRouteLink>

        <h1 class="title md-typescale-headline-medium">
          {{ isClaim ? '完成注册' : '注册账号' }}
        </h1>
        <p class="subtitle md-typescale-body-medium">
          <template v-if="isClaim">
            你的 {{ claimProvider }} 账号（{{ claimName || claimEmail || '第三方身份' }}）尚未关联云术账户，
            设置密码完成注册后将自动绑定。
          </template>
          <template v-else>创建云术账户，一处登录，全站通用。</template>
        </p>
      </template>

      <IdAlert v-if="done && isClaim" variant="success" title="注册成功">
        账号已创建并绑定 {{ claimProvider || '第三方账号' }}，正在进入账户面板…
      </IdAlert>
      <IdAlert v-else-if="done" variant="success" title="注册成功">
        <p>账号已创建，请使用新密码登录。</p>
        <IdNavButton variant="text" size="sm" to="/login">立即登录</IdNavButton>
      </IdAlert>

      <form v-else class="form" novalidate @submit.prevent="submit">
        <IdField
          v-model="form.username"
          label="账户名"
          placeholder="账户名"
          name="username"
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
          :action-text="countdown > 0 ? countdown + ' 秒后重发' : '发送验证码'"
          :action-disabled="countdown > 0"
          :action-loading="sending"
          :error="errors.code"
          @action="sendCode"
        />
        <div class="password-block">
          <IdField
            v-model="form.password"
            label="密码"
            placeholder="密码"
            type="password"
            autocomplete="new-password"
            revealable
            required
            :error="errors.password"
          />
          <IdStrengthMeter
            v-if="form.password"
            :value="form.password"
            :min-length="props.minPasswordLength"
          />
          <p v-else class="hint md-typescale-body-small">至少 {{ props.minPasswordLength }} 位</p>
        </div>
        <IdField
          v-model="form.confirm"
          label="确认密码"
          placeholder="再次输入密码"
          type="password"
          autocomplete="new-password"
          revealable
          required
          :error="errors.confirm || (passwordMismatch ? '两次输入的密码不一致' : '')"
        />

        <M3Button type="submit" block size="lg" :loading="submitting">注册</M3Button>

        <p class="legal">
          注册即代表你同意我们的
          <IdRouteLink to="/terms">服务条款</IdRouteLink>
          与
          <IdRouteLink to="/privacy">隐私政策</IdRouteLink>
          。
        </p>
      </form>

      <template #footer>
        已有账号？<IdRouteLink class="footer-link" to="/login">直接登录</IdRouteLink>
      </template>
    </IdCard>
  </IdLayout>
  <IdAuthNotice variant="docked" />
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  margin-block-end: 10px;
  padding: 4px 10px 4px 4px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  text-decoration: none;
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.back:hover {
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-primary);
}

.title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.subtitle {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.password-block {
  display: flex;
  flex-direction: column;
}

.hint {
  margin: 4px 0 0;
  padding-inline: 16px;
  color: var(--md-sys-color-on-surface-variant);
}

.legal {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: 1.6;
}

.legal :deep(a),
.footer-link {
  color: var(--md-sys-color-primary);
  text-decoration: none;
}

.legal :deep(a:hover),
.footer-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>