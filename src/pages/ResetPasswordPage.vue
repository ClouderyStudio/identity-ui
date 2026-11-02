<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import { identityApi, isApiError } from '@/api/client'

/**
 * 重置口令：邮件里链接的落点（/reset?token=...）。
 *
 * 令牌一次性、30 分钟有效；用掉之后再刷新页面必然失败，所以成功态要直接引导去登录，
 * 不要让用户反复点「重试」。
 */
const props = withDefaults(defineProps<{ token?: string }>(), { token: '' })

const emit = defineEmits<{ back: [] }>()

const form = reactive({ next: '', confirm: '' })
const errors = reactive({ next: '', confirm: '' })
const submitting = ref(false)
const formError = ref('')
const success = ref(false)

/** token 优先取 prop（路由参数），其次取地址栏查询串。 */
const token = computed(() => {
  if (props.token) return props.token
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('token') ?? ''
})

const tokenMissing = computed(() => !token.value)

function validate(): boolean {
  errors.next = form.next.length >= 8 ? '' : '新口令至少 8 位'
  errors.confirm = form.confirm === form.next ? '' : '两次输入的口令不一致'
  return !errors.next && !errors.confirm
}

async function submit() {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await identityApi.resetPassword({ token: token.value, newPassword: form.next })
    success.value = true
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
        <h1 class="id-card-title">重置口令</h1>
        <p class="id-card-subtitle">设置一个新的登录口令</p>
      </template>

      <IdAlert v-if="tokenMissing" variant="error" title="链接无效">
        这个链接缺少必要的参数，请重新申请找回口令。
      </IdAlert>

      <IdAlert v-else-if="success" variant="success" title="口令已重置">
        请使用新口令登录。
      </IdAlert>

      <form v-else class="id-form" novalidate @submit.prevent="submit">
        <IdField
          v-model="form.next"
          label="新口令"
          type="password"
          autocomplete="new-password"
          revealable
          required
          hint="至少 8 位"
          :error="errors.next"
        />
        <IdField
          v-model="form.confirm"
          label="确认新口令"
          type="password"
          autocomplete="new-password"
          revealable
          required
          :error="errors.confirm"
        />

        <IdAlert v-if="formError" variant="error">{{ formError }}</IdAlert>

        <IdButton type="submit" block :loading="submitting">保存新口令</IdButton>
      </form>

      <template #footer>
        <button type="button" class="id-link" @click="emit('back')">返回登录</button>
      </template>
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
  margin-top: var(--id-space-1);
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
