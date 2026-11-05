<script setup lang="ts">
import { ref } from 'vue'
import { IconArrowBack, IconOutbox } from '@/icons'
import { RouterLink } from 'vue-router'
import M3Button from '@/components/m3/M3Button.vue'
import M3Icon from '@/components/m3/M3Icon.vue'
import IdAlert from '@/components/IdAlert.vue'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import { identityApi, isApiError } from '@/api/client'

/**
 * 找回密码：提交邮箱后由后端发送重置链接（POST /identity/account/forgot-password）。
 * 无论邮箱是否注册都展示同一句受理提示，避免这个页面变成邮箱探测接口。
 */

const email = ref('')
const emailError = ref('')
const submitting = ref(false)
const submitted = ref(false)

async function submit() {
  emailError.value = ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    emailError.value = '请输入有效的邮箱地址'
    return
  }

  submitting.value = true
  try {
    await identityApi.forgotPassword(email.value.trim().toLowerCase())
    submitted.value = true
  } catch (error) {
    emailError.value = isApiError(error) ? error.detail : '网络异常，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <RouterLink class="back" to="/login">
          <M3Icon :icon="IconArrowBack" :size="18" />
          返回登录
        </RouterLink>

        <h1 class="title md-typescale-headline-medium">找回密码</h1>
        <p class="subtitle md-typescale-body-medium">输入注册邮箱，我们会发送重置链接。</p>
      </template>

      <div v-if="submitted" class="sent">
        <span class="sent__icon" aria-hidden="true">
          <M3Icon :icon="IconOutbox" :size="28" />
        </span>
        <h2 class="sent__title md-typescale-title-large">请求已受理</h2>
        <p class="sent__text md-typescale-body-medium">
          如果该邮箱对应的账号存在，重置邮件会在几分钟内送达。没有收到时请检查垃圾邮件目录，或稍后重试。
        </p>
        <M3Button variant="tonal" block href="/login">返回登录</M3Button>
      </div>

      <form v-else class="form" novalidate @submit.prevent="submit">
        <IdField
          v-model="email"
          label="邮箱"
          type="email"
          inputmode="email"
          placeholder="example@example.com"
          autocomplete="email"
          required
          :error="emailError"
        />
        <IdAlert variant="info">
          为保护账号安全，无论邮箱是否注册过，本页都会给出相同的受理提示。
        </IdAlert>
        <M3Button type="submit" block size="lg" :loading="submitting">发送重置邮件</M3Button>
      </form>

      <template #footer>
        想起密码了？<RouterLink class="footer-link" to="/login">返回登录</RouterLink>
      </template>
    </IdCard>
  </IdLayout>
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

.sent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.sent__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--md-sys-shape-corner-extra-large);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.sent__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.sent__text {
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
