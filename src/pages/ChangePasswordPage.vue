<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { IconArrowBack } from '@/icons'
import M3Button from '@/components/m3/M3Button.vue'
import M3Icon from '@/components/m3/M3Icon.vue'
import IdAlert from '@/components/IdAlert.vue'
import IdCard from '@/components/IdCard.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import IdStrengthMeter from '@/components/identity/IdStrengthMeter.vue'
import { identityApi, isApiError } from '@/api/client'

/**
 * 改密页。对应 POST /identity/account/password（需登录）。
 *
 * 已经用第三方账号登录、或存量账号还没设本地密码时，后端会回
 * 「该账号没有本地密码，无法在此设置」——这个提示原样展示，不改成含糊的说法。
 */
const form = reactive({ current: '', next: '', confirm: '' })
const errors = reactive({ current: '', next: '', confirm: '' })
const submitting = ref(false)
const formError = ref('')
const success = ref(false)

const sameAsCurrent = computed(
  () => form.next.length > 0 && form.next === form.current,
)

function validate(): boolean {
  errors.current = form.current ? '' : '请输入当前密码'
  errors.next = form.next.length >= 8 ? '' : '新密码至少 8 位'
  errors.confirm = form.confirm === form.next ? '' : '两次输入的密码不一致'
  if (sameAsCurrent.value) errors.next = '新密码不能与当前密码相同'
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
        <RouterLink class="back" to="/account">
          <M3Icon :icon="IconArrowBack" :size="18" />
          返回账户面板
        </RouterLink>

        <h1 class="title md-typescale-headline-medium">修改密码</h1>
        <p class="subtitle md-typescale-body-medium">修改后其它设备上的登录状态不会立即失效。</p>
      </template>

      <IdAlert v-if="success" variant="success" title="密码已修改">
        下次登录请使用新密码。
      </IdAlert>

      <form class="form" novalidate @submit.prevent="submit">
        <IdField
          v-model="form.current"
          label="当前密码"
          placeholder="输入当前密码"
          type="password"
          autocomplete="current-password"
          revealable
          required
          :error="errors.current"
        />

        <div class="password-block">
          <IdField
            v-model="form.next"
            label="新密码"
            placeholder="至少 8 位"
            type="password"
            autocomplete="new-password"
            revealable
            required
            hint="至少 8 位，建议混合大小写与符号"
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

        <IdAlert v-if="formError" variant="error" title="修改未完成">{{ formError }}</IdAlert>

        <M3Button type="submit" block size="lg" :loading="submitting">保存新密码</M3Button>
      </form>
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

.password-block {
  display: flex;
  flex-direction: column;
}
</style>
