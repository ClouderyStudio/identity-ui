<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { M3Button, M3Dialog } from '@clderystd/m3-ui'
import IdField from '../IdField.vue'
import IdStrengthMeter from './IdStrengthMeter.vue'
import { identityApi, isApiError } from '@/api/client'
import { useToast } from '@/composables/useToast'

/**
 * 修改密码对话框。对应 POST /identity/account/password（需登录）。
 *
 * 已经用第三方账号登录、或存量账号还没设本地密码时，后端会回
 * 「该账号没有本地密码，无法在此设置」——这个提示原样展示，不改成含糊的说法。
 */
const open = defineModel<boolean>({ required: true })

const form = reactive({ current: '', next: '', confirm: '' })
const errors = reactive({ current: '', next: '', confirm: '' })
const submitting = ref(false)
const toast = useToast()

const sameAsCurrent = computed(
  () => form.next.length > 0 && form.next === form.current,
)

/** 每次打开都回到空白状态，上一次的输入与红框不该留到下一次。 */
function reset(): void {
  form.current = ''
  form.next = ''
  form.confirm = ''
  errors.current = ''
  errors.next = ''
  errors.confirm = ''
  submitting.value = false
}

watch(open, (value) => {
  if (value) reset()
})

function validate(): boolean {
  errors.current = form.current ? '' : '请输入当前密码'
  errors.next = form.next.length >= 8 ? '' : '新密码至少 8 位'
  errors.confirm = form.confirm === form.next ? '' : '两次输入的密码不一致'
  if (sameAsCurrent.value) errors.next = '新密码不能与当前密码相同'
  return !errors.current && !errors.next && !errors.confirm
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  try {
    await identityApi.changePassword({ currentPassword: form.current, newPassword: form.next })
    // 成功后关掉对话框，结果用全局 snackbar 反馈——不用对话框里的一次性成功块
    reset()
    open.value = false
    toast.success('下次登录请使用新密码。', '密码已修改')
  } catch (error) {
    toast.error(isApiError(error) ? error.detail : '网络异常，请稍后重试', '操作未完成')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <M3Dialog v-model="open" title="修改密码">
    <div class="password">
      <p class="password__hint md-typescale-body-small">
        修改后其它设备上的登录状态不会立即失效。
      </p>

      <form id="id-change-password-form" class="password__form" novalidate @submit.prevent="submit">
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

        <div class="password__block">
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
      </form>
    </div>

    <template #actions>
      <M3Button variant="text" :disabled="submitting" @click="open = false">取消</M3Button>
      <!-- 按钮在对话框底部操作区，用 form 属性关联到正文里的表单，回车提交也照常可用 -->
      <M3Button
        type="submit"
        form="id-change-password-form"
        :loading="submitting"
      >
        保存新密码
      </M3Button>
    </template>
  </M3Dialog>
</template>

<style scoped>
.password__hint {
  margin: 0 0 16px;
  color: var(--md-sys-color-on-surface-variant);
}

.password__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.password__block {
  display: flex;
  flex-direction: column;
}
</style>
