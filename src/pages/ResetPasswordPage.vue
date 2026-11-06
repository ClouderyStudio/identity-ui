<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { IconCheckCircle, IconLinkOff } from '@/icons'
import { M3Button, M3Icon } from '@clderystd/m3-ui'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import IdStrengthMeter from '@/components/identity/IdStrengthMeter.vue'
import { identityApi, isApiError } from '@/api/client'
import { useToast } from '@/composables/useToast'
import IdNavButton from '@/components/identity/IdNavButton.vue'
import IdRouteLink from '@/components/identity/IdRouteLink.vue'

/**
 * 重置密码：邮件里链接的落点（/reset?token=...）。
 *
 * 令牌一次性、30 分钟有效；用掉之后再刷新页面必然失败，所以成功态要直接引导去登录，
 * 不要让用户反复点「重试」。
 */
const props = withDefaults(defineProps<{ token?: string }>(), { token: '' })

const form = reactive({ next: '', confirm: '' })
const errors = reactive({ next: '', confirm: '' })
const submitting = ref(false)
const toast = useToast()
const success = ref(false)

/** token 优先取 prop（路由参数），其次取地址栏查询串。 */
const token = computed(() => {
  if (props.token) return props.token
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('token') ?? ''
})

const tokenMissing = computed(() => !token.value)

function validate(): boolean {
  errors.next = form.next.length >= 8 ? '' : '新密码至少 8 位'
  errors.confirm = form.confirm === form.next ? '' : '两次输入的密码不一致'
  return !errors.next && !errors.confirm
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  try {
    await identityApi.resetPassword({ token: token.value, newPassword: form.next })
    success.value = true
  } catch (error) {
    toast.error(isApiError(error) ? error.detail : '网络异常，请稍后重试', '操作未完成')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <h1 class="title md-typescale-headline-medium">重置密码</h1>
        <p class="subtitle md-typescale-body-medium">设置一个新的登录密码。</p>
      </template>

      <!-- 链接失效 -->
      <div v-if="tokenMissing" class="state">
        <span class="state__icon state__icon--error" aria-hidden="true">
          <M3Icon :icon="IconLinkOff" :size="28" />
        </span>
        <h2 class="state__title md-typescale-title-large">链接无效</h2>
        <p class="state__text md-typescale-body-medium">
          这个链接缺少必要的参数，请重新申请找回密码。
        </p>
        <IdNavButton block to="/forgot">重新申请</IdNavButton>
      </div>

      <!-- 重置成功 -->
      <div v-else-if="success" class="state">
        <span class="state__icon" aria-hidden="true">
          <M3Icon :icon="IconCheckCircle" :size="28" />
        </span>
        <h2 class="state__title md-typescale-title-large">密码已重置</h2>
        <p class="state__text md-typescale-body-medium">请使用新密码登录。</p>
        <IdNavButton block to="/login">去登录</IdNavButton>
      </div>

      <form v-else class="form" novalidate @submit.prevent="submit">
        <div class="password-block">
          <IdField
            v-model="form.next"
            label="新密码"
            placeholder="至少 8 位"
            type="password"
            autocomplete="new-password"
            revealable
            required
            :error="errors.next"
          />
          <IdStrengthMeter v-if="form.next" :value="form.next" />
        </div>
        <IdField
          v-model="form.confirm"
          label="确认新密码"
          placeholder="再次输入新密码"
          type="password"
          autocomplete="new-password"
          revealable
          required
          :error="errors.confirm"
        />

        <M3Button type="submit" block size="lg" :loading="submitting">保存新密码</M3Button>
      </form>

      <template #footer>
        <IdRouteLink class="footer-link" to="/login">返回登录</IdRouteLink>
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
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

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.state__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--md-sys-shape-corner-extra-large);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.state__icon--error {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.state__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.state__text {
  margin: 0 0 8px;
  color: var(--md-sys-color-on-surface-variant);
}

.footer-link {
  color: var(--md-sys-color-primary);
  text-decoration: none;
}

.footer-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>