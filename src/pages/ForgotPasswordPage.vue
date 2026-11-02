<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
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
        <RouterLink class="id-back" to="/login">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          返回登录
        </RouterLink>
        <h1 class="id-card-title">找回密码</h1>
        <p class="id-card-subtitle">输入注册邮箱，我们会发送重置链接</p>
      </template>

      <IdAlert v-if="submitted" variant="success" title="请求已受理">
        如果该邮箱对应的账号存在，重置邮件会在几分钟内送达。没有收到时请检查垃圾邮件目录，或稍后重试。
      </IdAlert>

      <form v-else class="id-form" novalidate @submit.prevent="submit">
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
        <IdButton type="submit" block :loading="submitting">发送重置邮件</IdButton>
      </form>

      <template #footer>
        想起密码了？<RouterLink class="id-link" to="/login">返回登录</RouterLink>
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

.id-link {
  padding: 0;
  font-size: var(--id-font-small);
  color: var(--id-accent);
  background: none;
  border: none;
  cursor: pointer;
}
</style>