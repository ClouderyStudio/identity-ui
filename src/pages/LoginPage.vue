<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { IconLogin } from '@/icons'
import IdAlert from '@/components/IdAlert.vue'
import IdCard from '@/components/IdCard.vue'
import IdDivider from '@/components/IdDivider.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import IdProviderButton from '@/components/identity/IdProviderButton.vue'
import { M3Button } from '@clderystd/m3-ui'
import { useSession } from '@/composables/useSession'
import { identityApi, isApiError, type ExternalProvider } from '@/api/client'

/**
 * 登录页。
 *
 * 密码登录走 POST /identity/account/login：服务端校验密码并**签发会话 Cookie**，
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
    /** 登录成功后回跳的站内地址；缺省读 ?returnUrl=，再缺省进账户面板。 */
    returnUrl?: string
  }>(),
  { returnUrl: '' },
)

const router = useRouter()
const session = useSession()

/** 最终回跳地址：prop > 查询串 > 账户面板。只接受站内路径，挡住 open redirect。 */
function resolveReturnUrl(): string {
  const fromQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnUrl')
    : null
  const candidate = props.returnUrl || fromQuery || '/account'
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/account'
}

const form = reactive({ account: '', password: '' })
const errors = reactive({ account: '', password: '' })
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
    const user = await identityApi.login({ account: form.account.trim(), password: form.password })
    // 会话 Cookie 已由服务端种下；同步内存状态后走路由，避免整页刷新
    session.set(user)
    await router.replace(resolveReturnUrl())
  } catch (error) {
    formError.value = isApiError(error) ? error.detail : '网络异常，请稍后再试'
  } finally {
    submitting.value = false
  }
}

function startExternal(name: string) {
  identityApi.startExternalLogin(name, resolveReturnUrl())
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <p class="login__eyebrow md-typescale-label-medium">云术身份中心</p>
        <h1 class="login__title md-typescale-headline-medium">登录</h1>
        <p class="login__subtitle md-typescale-body-medium">
          使用你的云术账户继续，登录状态在全部站点通用。
        </p>
      </template>

      <form class="login__form" novalidate @submit.prevent="submit">
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
          placeholder="输入密码"
          type="password"
          autocomplete="current-password"
          revealable
          required
          :error="errors.password"
        />

        <div class="login__links">
          <RouterLink class="login__link md-typescale-label-large" to="/forgot">找回密码</RouterLink>
          <RouterLink class="login__link md-typescale-label-large" to="/register">注册账号</RouterLink>
        </div>

        <IdAlert v-if="formError" variant="error" title="登录未完成">{{ formError }}</IdAlert>

        <M3Button type="submit" block size="lg" :loading="submitting" :trailing-icon="IconLogin">
          登入
        </M3Button>
      </form>

      <template v-if="providers.length">
        <IdDivider label="或使用第三方账号" />
        <div class="login__providers">
          <IdProviderButton
            v-for="provider in providers"
            :key="provider.name"
            :name="provider.name"
            :display-name="provider.displayName"
            :icon="provider.icon"
            @click="startExternal(provider.name)"
          />
        </div>
      </template>

      <template #footer>
        <p class="login__legal">
          登录即表示你同意我们的
          <RouterLink to="/terms">服务条款</RouterLink>
          与
          <RouterLink to="/privacy">隐私政策</RouterLink>
          。
        </p>
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.login__eyebrow {
  margin: 0;
  color: var(--md-sys-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.login__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.login__subtitle {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login__links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-start: -4px;
}

.login__link {
  padding: 4px 8px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-primary);
  text-decoration: none;
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.login__link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
}

.login__providers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login__legal {
  margin: 0;
}

.login__legal :deep(a) {
  color: var(--md-sys-color-primary);
  text-decoration: none;
}

.login__legal :deep(a:hover) {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
