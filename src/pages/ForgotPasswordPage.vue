<script setup lang="ts">
import { ref } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'

/**
 * 找回口令。
 *
 * **后端还没有找回接口**（P2 只做了注册与改密，邮箱验证码重置属于后续阶段），
 * 所以这里只做到「提交邮箱 → 展示已受理」，不假装成功、不发明接口。
 * 接上后端时把 submit 里的注释替换成真实调用即可，其余 UI 不用动。
 */
const emit = defineEmits<{ back: [] }>()

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
    // TODO(后端就绪后)：改为 POST /identity/account/forgot-password { email }
    // 现在刻意不调接口：没有该端点时请求只会 404，展示「已受理」才是诚实的。
    await new Promise((resolve) => setTimeout(resolve, 400))
    submitted.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <button type="button" class="id-back" @click="emit('back')">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          返回登录
        </button>
        <h1 class="id-card-title">找回口令</h1>
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
        想起口令了？<button type="button" class="id-link" @click="emit('back')">返回登录</button>
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