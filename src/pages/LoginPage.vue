<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconLogin } from '@/icons'
import IdCard from '@/components/IdCard.vue'
import IdDivider from '@/components/IdDivider.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'
import IdAuthNotice from '@/components/identity/IdAuthNotice.vue'
import IdProviderButton from '@/components/identity/IdProviderButton.vue'
import { M3Button } from '@clderystd/m3-ui'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import { identityApi, isApiError, type ExternalProvider } from '@/api/client'
import IdLegalLink from '@/components/identity/IdLegalLink.vue'
import IdRouteLink from '@/components/identity/IdRouteLink.vue'

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
const toast = useToast()

/**
 * 最终回跳地址：prop > 查询串 > 账户面板。
 *
 * 站内路径（/xxx）走前端路由；**API 域上的绝对地址**（形如
 * https://api.cloudery.cn/login/oauth/authorize?…）要整页跳过去 —— 那是
 * `/login/oauth/authorize` 在未登录时把我们送到这里的那条路径，登录完必须回到它继续发
 * 授权码，否则外部应用（心灵驿站 / SCForge …）永远回不去。
 *
 * 绝对地址只认「本 API 的 authorize 地址」这一种：随便接受外部绝对地址就是开放重定向。
 */
function apiBase(): string {
  return (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '')
}

type ReturnTarget = { kind: 'route'; to: string } | { kind: 'url'; to: string }

/** 解析最终回跳目标；非法一律退回账户面板。 */
function resolveReturnTarget(): ReturnTarget {
  const fromQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnUrl')
    : null
  const candidate = (props.returnUrl || fromQuery || '/account').trim()

  if (candidate.startsWith('/') && !candidate.startsWith('//')) {
    return { kind: 'route', to: candidate }
  }

  // 只放行本 API 的授权端点：它是「回到原站点继续登录」的唯一合法绝对地址。
  const base = apiBase()
  if (base && candidate.startsWith(base + '/login/oauth/authorize?')) {
    return { kind: 'url', to: candidate }
  }

  return { kind: 'route', to: '/account' }
}

/** 登录成功后真正跳转：站内走路由，授权地址整页跳（浏览器要回到 API 域）。 */
async function goAfterLogin(): Promise<void> {
  const target = resolveReturnTarget()
  if (target.kind === 'url') {
    window.location.assign(target.to)
    return
  }
  await router.replace(target.to)
}

const form = reactive({ account: '', password: '' })
const errors = reactive({ account: '', password: '' })
const submitting = ref(false)
const formError = ref('')
const providers = ref<ExternalProvider[]>([])

onMounted(async () => {
  // 第三方登录失败时后端会 302 回 /login?externalError=...，
  // 在这里弹成 snackbar，并把参数从地址栏清掉（刷新不会重复提示）。
  const externalError = new URLSearchParams(window.location.search).get('externalError')
  if (externalError) {
    toast.error(externalError, '第三方登录未完成')
    const url = new URL(window.location.href)
    url.searchParams.delete('externalError')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }

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
    // 会话 Cookie 已由服务端种下；同步内存状态后再决定去哪
    session.set(user)
    await goAfterLogin()
  } catch (error) {
    // 用 snackbar 而不是行内横幅：失败原因常常是一句话，横幅会把表单往下推
    toast.error(isApiError(error) ? error.detail : '网络异常，请稍后再试', '登录未完成')
  } finally {
    submitting.value = false
  }
}

/**
 * 第三方登录也要带着「回来继续干什么」。
 *
 * 传的是站内相对路径：若用户从某个应用的 authorize 过来，它是 /authorize?ticket=...，
 * 第三方回调回来后落到确认页继续签发授权码；以前固定传 /account，
 * 于是第三方登录永远回不到原站点。
 */
function startExternal(name: string) {
  const target = resolveReturnTarget()
  identityApi.startExternalLogin(name, target.kind === 'url' ? '/account' : target.to)
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
          <IdRouteLink class="login__link md-typescale-label-large" to="/forgot">找回密码</IdRouteLink>
          <IdRouteLink class="login__link md-typescale-label-large" to="/register">注册账号</IdRouteLink>
        </div>

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
          <IdLegalLink to="terms">服务条款</IdLegalLink>
          与
          <IdLegalLink to="privacy">隐私政策</IdLegalLink>
          。
        </p>
      </template>
    </IdCard>
  </IdLayout>
  <IdAuthNotice variant="docked" />
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