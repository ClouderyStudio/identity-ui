<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdDivider from '@/components/IdDivider.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import { identityApi, isApiError, type ExternalProvider } from '@/api/client'

/**
 * 登录页。
 *
 * 口令登录走 POST /identity/account/login：服务端校验口令并**签发会话 Cookie**，
 * 之后的账户面板与其它受保护接口都靠这个 Cookie（HttpOnly，前端拿不到也不需要拿）。
 *
 * 这里刻意不用 /connect/token：password 授权只回 OIDC token、不建立会话，
 * 拿它当登录会让「登录成功但面板显示未登录」。
 * 需要令牌的 RP 场景仍走标准授权码流程（/connect/authorize）。
 *
 * 第三方登录 → 整页跳 /identity/external/{provider}/challenge（E1 落地）。
 */
const props = withDefaults(
  defineProps<{
    /** 登录成功后回跳的站内地址。 */
    returnUrl?: string
  }>(),
  // 默认去账户面板：登录成功要有明确去处，落在登录页本身等于什么都没发生
  { returnUrl: '/account' },
)

const form = reactive({ account: '', password: '' })
const errors = reactive<{ account: string; password: string }>({ account: '', password: '' })
const submitting = ref(false)
const formError = ref('')
const providers = ref<ExternalProvider[]>([])

onMounted(async () => {
  providers.value = await identityApi.providers()
})

function validate(): boolean {
  errors.account = form.account.trim() ? '' : '请输入账户或邮箱'
  errors.password = form.password ? '' : '请输入密码'
  return !errors.account && !errors.password
}

async function submit() {
  formError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await identityApi.login({ account: form.account.trim(), password: form.password })
    // 会话 Cookie 已由服务端种下，整页跳转让宿主应用重新拉取登录态
    window.location.assign(props.returnUrl)
  } catch (error) {
    formError.value = isApiError(error) ? error.detail : '网络异常，请稍后再试'
  } finally {
    submitting.value = false
  }
}

const emit = defineEmits<{
  success: [payload: { accessToken: string; returnUrl: string }]
  register: []
  forgot: []
}>()
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <p class="id-eyebrow">云术身份中心</p>
        <h1 class="id-card-title">登录</h1>
        <p class="id-card-subtitle">使用你的云术账户继续</p>
      </template>

      <form class="id-form" novalidate @submit.prevent="submit">
        <IdField
          v-model="form.account"
          label="账户 / 邮箱"
          placeholder="账户名或邮箱地址"
          autocomplete="username"
          required
          :error="errors.account"
        />
        <IdField
          v-model="form.password"
          label="密码"
          type="password"
          placeholder="密码"
          autocomplete="current-password"
          revealable
          required
          :error="errors.password"
        />

        <div class="id-form__links">
          <button type="button" class="id-link" @click="emit('forgot')">找回密码</button>
          <button type="button" class="id-link" @click="emit('register')">注册账号</button>
        </div>

        <IdAlert v-if="formError" variant="error">{{ formError }}</IdAlert>

        <IdButton type="submit" block :loading="submitting">登入</IdButton>
      </form>

      <template v-if="providers.length">
        <IdDivider label="或使用第三方账号" />
        <div class="id-providers">
          <button
            v-for="provider in providers"
            :key="provider.name"
            type="button"
            class="id-provider"
            @click="identityApi.startExternalLogin(provider.name, returnUrl)"
          >
            {{ provider.displayName }}
          </button>
        </div>
      </template>

      <template #footer>
        登录即表示你同意我们的
        <a href="/terms">服务条款</a>
        与
        <a href="/privacy">隐私策略</a>
        。
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.id-eyebrow {
  margin-bottom: var(--id-space-2);
  font-size: var(--id-font-small);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--id-text-muted);
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

.id-form__links {
  display: flex;
  justify-content: space-between;
  margin-top: calc(var(--id-space-1) * -1);
}

.id-link {
  padding: 0;
  font-size: var(--id-font-small);
  color: var(--id-accent);
  background: none;
  border: none;
  cursor: pointer;
}

.id-link:hover {
  color: var(--id-accent-strong);
  text-decoration: underline;
}

.id-providers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--id-space-2);
}

.id-provider {
  flex: 1 1 120px;
  height: 38px;
  padding: 0 var(--id-space-4);
  font-size: var(--id-font-small);
  font-weight: 600;
  color: var(--id-text);
  background: var(--id-surface-strong);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
  cursor: pointer;
  transition: background-color var(--id-transition), border-color var(--id-transition);
}

.id-provider:hover {
  background: var(--id-surface-hover);
  border-color: var(--id-border-strong);
}
</style>