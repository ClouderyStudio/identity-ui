<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconEvent,
  IconHistory,
  IconHub,
  IconKey,
  IconLock,
  IconLogout,
  IconManageAccounts,
  IconPerson,
  IconSecurity,
  IconShield,
  IconSwapHoriz,
  IconVerified,
} from '@/icons'
import { M3Avatar, M3Button, M3Card, M3Chip, M3Icon } from '@clderystd/m3-ui'
import IdAlert from '@/components/IdAlert.vue'
import IdThemeToggle from '@/components/identity/IdThemeToggle.vue'
import IdSiteShell from '@/components/IdSiteShell.vue'
import { identityApi, isApiError, type AccountProfile, type ExternalProvider } from '@/api/client'
import { useSession } from '@/composables/useSession'

/**
 * 账户面板（Dashboard）：全屏布局。
 *
 *   身份 Hero（头像 / 欢迎语 / 编号 / 邮箱 / 状态）
 *   左列：账户资料（UID、状态、注册时间、最近登录、绑定邮箱、登录方式）+ 设置
 *   右列：可用的登录方式、已绑定账号
 *
 * 数据来自 GET /identity/account/profile（服务端会话 Cookie 鉴权）。
 */
const router = useRouter()
const session = useSession()

const profile = ref<AccountProfile | null>(null)
const providers = ref<ExternalProvider[]>([])
const loading = ref(true)
const message = ref('')
const busy = ref('')

const unbound = computed(() => {
  const bound = new Set((profile.value?.bindings ?? []).map((item) => item.provider))
  return providers.value.filter((provider) => !bound.has(provider.name))
})

/** UID 展示成短编号；完整 GUID 放在 title 里，避免长串撑坏排版。 */
const shortId = computed(() =>
  profile.value ? profile.value.id.replace(/-/g, '').slice(0, 8).toUpperCase() : '',
)

onMounted(async () => {
  await load()
  await confirmPendingBind()
})

async function load() {
  loading.value = true
  try {
    profile.value = await identityApi.profile()
    providers.value = await identityApi.providers()
  } finally {
    loading.value = false
  }
}

/**
 * 处理第三方回调带回来的 `?bind=<provider>`。
 *
 * 绑定是三段式：账户页点「绑定」→ 上游授权 → 回调落在**已登录**会话上时，
 * 后端只把第三方身份暂存起来（IExternalBindPendingStore），然后 302 回 `/account?bind=github`。
 * **真正写入绑定必须由这里再确认一次**——后端不接受客户端自报身份，
 * 否则知道别人的 social_uid 就能抢绑。
 *
 * 曾经漏了这一步：回调成功、页面也回到了 `/account?bind=github`，但什么都没发生，
 * 后端日志停在「等待确认绑定」，票据 10 分钟后静默过期。
 */
async function confirmPendingBind() {
  const provider = new URLSearchParams(window.location.search).get('bind')
  if (!provider) return

  // 先清掉 query：否则用户刷新会重复提交，第二次必然报「没有待确认的绑定」，看起来像失败。
  // 用 replaceState 而非 push，避免「后退」回到这个一次性地址。
  const cleaned = new URL(window.location.href)
  cleaned.searchParams.delete('bind')
  window.history.replaceState({}, '', cleaned.pathname + cleaned.search + cleaned.hash)

  try {
    await identityApi.bindExternal(provider)
    message.value = '绑定成功'
  } catch (error) {
    // 后端的 detail 已是可读中文，且能区分「票据过期」与「已被其他账号绑定」两种关键情形，
    // 直接透出，不要加前缀把它盖住。
    message.value = isApiError(error) ? error.detail : '绑定失败，请重试'
  }

  // 无论成败都重拉：成功要显示新绑定，失败也要让列表回到真实状态。
  await load()
}

/** 时间统一按北京时间（UTC+8）展示。 */
function formatTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

async function unbind(provider: string) {
  message.value = ''
  busy.value = provider
  try {
    const response = await fetch('/identity/external/' + encodeURIComponent(provider), {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { detail?: string } | null
      message.value = body?.detail ?? '解绑失败'
      return
    }
    message.value = '已解绑'
    await load()
  } catch {
    message.value = '网络异常，请稍后重试'
  } finally {
    busy.value = ''
  }
}

async function logout() {
  await identityApi.signOut()
  session.clear()
  await router.replace('/login')
}

const facts = computed(() => {
  const current = profile.value
  if (!current) return []
  return [
    { icon: IconPerson, label: 'UID', value: shortId.value, mono: true, title: current.id },
    { icon: IconVerified, label: '账户状态', value: current.hasLocalPassword ? '正常' : '仅第三方登录' },
    { icon: IconEvent, label: '注册时间', value: formatTime(current.createdAt) },
    { icon: IconHistory, label: '最近登录', value: formatTime(current.lastLoginAt) },
    { icon: IconHub, label: '绑定邮箱', value: current.email || '未绑定' },
    {
      icon: IconKey,
      label: '登录方式',
      value: current.hasLocalPassword ? '密码 + 第三方' : '仅第三方',
    },
  ]
})
</script>

<template>
  <IdSiteShell>
    <template #nav>
      <span v-if="profile" class="nav-user md-typescale-label-large">{{ profile.username }}</span>
      <M3Button
        v-if="profile?.isAdmin"
        variant="text"
        size="sm"
        :icon="IconManageAccounts"
        @click="router.push('/admin/accounts')"
      >
        管理后台
      </M3Button>
      <M3Button variant="text" size="sm" :icon="IconLogout" @click="logout">退出登录</M3Button>
    </template>

    <p v-if="loading" class="loading md-typescale-body-medium">加载中…</p>

    <IdAlert v-else-if="!profile" variant="info" title="尚未登录">
      请先登录后查看账户信息。
    </IdAlert>

    <template v-else>
      <!-- 身份 Hero -->
      <section class="hero">
        <div class="hero__avatar">
          <M3Avatar :src="profile.avatar ?? undefined" :name="profile.username" :size="88" ring />
        </div>

        <div class="hero__text">
          <p class="hero__eyebrow md-typescale-label-medium">账户中心</p>
          <h1 class="hero__title md-typescale-headline-medium">
            欢迎回来，{{ profile.username }}
          </h1>
          <p class="hero__meta md-typescale-body-medium">
            <span class="hero__id id-mono" :title="profile.id">#{{ shortId }}</span>
            <span class="hero__dot" aria-hidden="true">·</span>
            <span>{{ profile.email || '未绑定邮箱' }}</span>
          </p>
        </div>

        <div class="hero__badges">
          <M3Chip
            variant="assist"
            :icon="IconShield"
            :label="profile.hasLocalPassword ? '账号状态正常' : '仅第三方登录'"
          />
          <M3Chip v-if="profile.isAdmin" variant="assist" :icon="IconSecurity" label="管理员" />
        </div>
      </section>

      <div class="grid">
        <!-- 左列 -->
        <div class="column">
          <M3Card variant="filled" shape="large" class="panel">
            <h2 class="panel__title md-typescale-title-medium">
              <M3Icon :icon="IconPerson" :size="20" />
              账户资料
            </h2>

            <dl class="facts">
              <div v-for="fact in facts" :key="fact.label" class="fact">
                <dt class="fact__label md-typescale-body-small">
                  <M3Icon :icon="fact.icon" :size="16" />
                  {{ fact.label }}
                </dt>
                <dd
                  class="fact__value md-typescale-body-large"
                  :class="{ 'id-mono': fact.mono }"
                  :title="fact.title"
                >
                  {{ fact.value }}
                </dd>
              </div>
            </dl>
          </M3Card>

          <M3Card variant="filled" shape="large" class="panel">
            <h2 class="panel__title md-typescale-title-medium">
              <M3Icon :icon="IconLock" :size="20" />
              设置
            </h2>

            <div class="setting">
              <div class="setting__text">
                <p class="setting__name md-typescale-body-large">账户安全</p>
                <p class="setting__hint md-typescale-body-small">定期更换密码，不要与其他站点复用。</p>
              </div>
              <M3Button
                variant="tonal"
                size="sm"
                :icon="IconKey"
                @click="router.push('/password')"
              >
                修改密码
              </M3Button>
            </div>

            <div class="setting">
              <div class="setting__text">
                <p class="setting__name md-typescale-body-large">应用主题</p>
                <p class="setting__hint md-typescale-body-small">浅色 / 深色 / 跟随系统。</p>
              </div>
              <IdThemeToggle variant="segmented" />
            </div>
          </M3Card>
        </div>

        <!-- 右列 -->
        <div class="column">
          <M3Card variant="filled" shape="large" class="panel">
            <h2 class="panel__title md-typescale-title-medium">
              <M3Icon :icon="IconHub" :size="20" />
              可用于登录本账号的方式
            </h2>

            <ul class="bindings">
              <li v-for="binding in profile.bindings" :key="binding.provider" class="binding">
                <M3Avatar :name="binding.providerName" :size="40" />
                <div class="binding__text">
                  <p class="binding__name md-typescale-body-large">{{ binding.providerName }}</p>
                  <p class="binding__time md-typescale-body-small">
                    绑定于 {{ formatTime(binding.createdAt) }}
                  </p>
                </div>
                <M3Button
                  variant="text"
                  size="sm"
                  :loading="busy === binding.provider"
                  @click="unbind(binding.provider)"
                >
                  解绑
                </M3Button>
              </li>

              <li v-if="profile.hasLocalPassword" class="binding">
                <M3Avatar :name="profile.username" :size="40" />
                <div class="binding__text">
                  <p class="binding__name md-typescale-body-large">账号密码</p>
                  <p class="binding__time md-typescale-body-small">已设置</p>
                </div>
                <M3Button variant="text" size="sm" @click="router.push('/password')">修改</M3Button>
              </li>
            </ul>

            <template v-if="unbound.length">
              <p class="panel__subtitle md-typescale-body-small">还可绑定：</p>
              <div class="providers">
                <M3Chip
                  v-for="provider in unbound"
                  :key="provider.name"
                  variant="assist"
                  :icon="IconSwapHoriz"
                  :label="provider.displayName"
                  @click="identityApi.startExternalLogin(provider.name, '/account')"
                />
              </div>
            </template>

            <p v-if="!profile.bindings.length && !unbound.length" class="panel__subtitle md-typescale-body-small">
              还没有配置任何第三方登录方式。
            </p>
          </M3Card>

          <IdAlert v-if="message" variant="info" dismissible @dismiss="message = ''">
            {{ message }}
          </IdAlert>
        </div>
      </div>
    </template>
  </IdSiteShell>
</template>

<style scoped>
.nav-user {
  padding-inline: 8px;
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}

.loading {
  color: var(--md-sys-color-on-surface-variant);
}

/* ---------- Hero ---------- */
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  margin-block-end: 24px;
  padding: 24px;
  border-radius: var(--md-sys-shape-corner-extra-large);
  background-color: var(--md-sys-color-surface-container-low);
  animation: md-fade-up var(--md-sys-motion-duration-extra-long1)
    var(--md-sys-motion-easing-emphasized-decelerate) both;
}

.hero__avatar {
  flex-shrink: 0;
}

.hero__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.hero__eyebrow {
  margin: 0;
  color: var(--md-sys-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.hero__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.hero__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 0;
  color: var(--md-sys-color-on-surface-variant);
}

.hero__id {
  color: var(--md-sys-color-primary);
}

.hero__dot {
  opacity: 0.5;
}

.hero__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

/* ---------- Grid ---------- */
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel :deep(.md-card__content) {
  gap: 16px;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.panel__title :deep(svg) {
  color: var(--md-sys-color-primary);
}

.panel__subtitle {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

/* ---------- Facts ---------- */
.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fact__label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--md-sys-color-on-surface-variant);
}

.fact__label :deep(svg) {
  color: var(--md-sys-color-primary);
  opacity: 0.85;
}

.fact__value {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  word-break: break-word;
}

/* ---------- Settings ---------- */
.setting {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface-container-high);
}

.setting__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.setting__name {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.setting__hint {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

/* ---------- Bindings ---------- */
.bindings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.binding {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 12px;
  border-radius: var(--md-sys-shape-corner-large);
  background-color: var(--md-sys-color-surface-container-high);
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.binding__text {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  flex: 1;
}

.binding__name {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.binding__time {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.providers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .facts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
