<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdSiteShell from '@/components/IdSiteShell.vue'
import IdThemeToggle from '@/components/IdThemeToggle.vue'
import { identityApi, type AccountProfile, type ExternalProvider } from '@/api/client'
import { useSession } from '@/composables/useSession'

/**
 * 账户面板（Dashboard）：全屏布局，参考 Natayark 账户中心的结构。
 *
 *   顶部身份条（头像 / 欢迎语 / 编号 / 邮箱）
 *   左列：资料卡（UID、状态、注册时间、最近登录、绑定邮箱、登录方式）+ 设置
 *   右列：可用登录方式、已绑定账号
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
const shortId = computed(() => (profile.value ? profile.value.id.replace(/-/g, '').slice(0, 8).toUpperCase() : ''))

onMounted(load)

async function load() {
  loading.value = true
  try {
    profile.value = await identityApi.profile()
    providers.value = await identityApi.providers()
  } finally {
    loading.value = false
  }
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
    second: '2-digit',
    hour12: false,
  })
}

function initials(name?: string): string {
  return (name ?? '?').trim().slice(0, 1).toUpperCase()
}

async function unbind(provider: string) {
  message.value = ''
  busy.value = provider
  try {
    const response = await fetch(`/identity/external/${encodeURIComponent(provider)}`, {
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
</script>

<template>
  <IdSiteShell>
    <template #nav>
      <span class="nav-user">{{ profile?.username ?? '' }}</span>
      <button type="button" class="nav-action" @click="logout">退出登录</button>
    </template>

    <p v-if="loading" class="loading">加载中…</p>

    <IdAlert v-else-if="!profile" variant="info" title="尚未登录">
      请先登录后查看账户信息。
    </IdAlert>

    <template v-else>
      <!-- 身份条 -->
      <section class="identity">
        <span class="identity__avatar" aria-hidden="true">{{ initials(profile.username) }}</span>
        <div class="identity__text">
          <h1 class="identity__title">
            欢迎回来，{{ profile.username }}
            <span class="identity__id">#{{ shortId }}</span>
          </h1>
          <p class="identity__meta">{{ profile.email || '未绑定邮箱' }}</p>
        </div>
      </section>

      <div class="grid">
        <!-- 左列 -->
        <div class="column">
          <section class="panel">
            <h2 class="panel__title">账户资料</h2>
            <dl class="facts">
              <div class="fact">
                <dt>UID</dt>
                <dd class="fact__mono" :title="profile.id">{{ shortId }}</dd>
              </div>
              <div class="fact">
                <dt>账户状态</dt>
                <dd>
                  <span class="status" :class="profile.hasLocalPassword ? 'is-ok' : 'is-partial'">
                    {{ profile.hasLocalPassword ? '正常' : '仅第三方登录' }}
                  </span>
                </dd>
              </div>
              <div class="fact">
                <dt>注册时间</dt>
                <dd>{{ formatTime(profile.createdAt) }}</dd>
              </div>
              <div class="fact">
                <dt>最后登录时间</dt>
                <dd>{{ formatTime(profile.lastLoginAt) }}</dd>
              </div>
              <div class="fact">
                <dt>绑定邮箱</dt>
                <dd>{{ profile.email || '未绑定' }}</dd>
              </div>
              <div class="fact">
                <dt>登录方式</dt>
                <dd>{{ profile.hasLocalPassword ? '密码 + 第三方' : '仅第三方' }}</dd>
              </div>
            </dl>
          </section>

          <section class="panel">
            <h2 class="panel__title">设置</h2>
            <div class="settings">
              <div class="settings__group">
                <span class="settings__label">账户安全</span>
                <div class="settings__actions">
                  <IdButton variant="secondary" size="sm" @click="router.push('/password')">修改密码</IdButton>
                </div>
              </div>
              <div class="settings__group">
                <span class="settings__label">应用主题</span>
                <IdThemeToggle />
              </div>
            </div>
          </section>
        </div>

        <!-- 右列 -->
        <div class="column">
          <section class="panel">
            <h2 class="panel__title">可用于登录本账号的方式</h2>
            <p v-if="!profile.bindings.length && !unbound.length" class="muted">还没有配置任何第三方登录方式。</p>
            <ul v-else class="bindings">
              <li v-for="binding in profile.bindings" :key="binding.provider" class="binding">
                <span class="binding__main">
                  <span class="binding__name">{{ binding.providerName }}</span>
                  <span class="binding__time">绑定于 {{ formatTime(binding.createdAt) }}</span>
                </span>
                <IdButton
                  variant="secondary"
                  size="sm"
                  :loading="busy === binding.provider"
                  @click="unbind(binding.provider)"
                >
                  解绑
                </IdButton>
              </li>
              <li v-if="profile.hasLocalPassword" class="binding">
                <span class="binding__main">
                  <span class="binding__name">账号密码</span>
                  <span class="binding__time">已设置</span>
                </span>
                <IdButton variant="secondary" size="sm" @click="router.push('/password')">修改</IdButton>
              </li>
            </ul>

            <template v-if="unbound.length">
              <p class="muted">还可绑定：</p>
              <div class="providers">
                <button
                  v-for="provider in unbound"
                  :key="provider.name"
                  type="button"
                  class="provider"
                  @click="identityApi.startExternalLogin(provider.name, '/account')"
                >
                  {{ provider.displayName }}
                </button>
              </div>
            </template>
          </section>

          <IdAlert v-if="message" variant="info">{{ message }}</IdAlert>
        </div>
      </div>
    </template>
  </IdSiteShell>
</template>

<style scoped>
.nav-user {
  padding: 0 var(--id-space-2);
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.nav-action {
  padding: 5px 12px;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color var(--id-transition), color var(--id-transition);
}

.nav-action:hover {
  color: var(--id-text);
  background: var(--id-surface-hover);
}

.loading {
  color: var(--id-text-muted);
}

/* 身份条 */
.identity {
  display: flex;
  align-items: center;
  gap: var(--id-space-4);
  padding: var(--id-space-5) 0 var(--id-space-4);
}

.identity__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--id-accent-soft);
  border: 1px solid var(--id-border-strong);
  color: var(--id-accent);
  font-size: 26px;
  font-weight: 600;
}

.identity__title {
  font-size: var(--id-font-subtitle);
  font-weight: 600;
  color: var(--id-text);
}

.identity__id {
  font-size: var(--id-font-body);
  font-weight: 400;
  color: var(--id-text-muted);
}

.identity__meta {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

/* 两列栅格 */
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: var(--id-space-4);
  align-items: start;
}

.column {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-4);
}

.panel {
  padding: var(--id-space-5);
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-card);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
}

.panel__title {
  margin-bottom: var(--id-space-4);
  font-size: var(--id-font-body);
  font-weight: 600;
  color: var(--id-text);
}

.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--id-space-4);
  margin: 0;
}

.fact dt {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.fact dd {
  margin: 2px 0 0;
  font-size: var(--id-font-body);
  color: var(--id-text);
  word-break: break-word;
}

.fact__mono {
  font-family: 'Cascadia Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status.is-ok {
  color: var(--id-success);
}

.status.is-partial {
  color: var(--id-warning);
}

.settings {
  display: flex;
  flex-wrap: wrap;
  gap: var(--id-space-6);
}

.settings__group {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
}

.settings__label {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.settings__actions {
  display: flex;
  gap: var(--id-space-2);
}

.bindings {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.binding {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-3);
  padding: var(--id-space-3);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
}

.binding__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.binding__name {
  font-size: var(--id-font-body);
  color: var(--id-text);
}

.binding__time {
  font-size: var(--id-font-small);
  color: var(--id-text-faint);
}

.muted {
  margin-top: var(--id-space-3);
  font-size: var(--id-font-small);
  color: var(--id-text-faint);
}

.providers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--id-space-2);
  margin-top: var(--id-space-2);
}

.provider {
  height: 30px;
  padding: 0 var(--id-space-3);
  font-size: var(--id-font-small);
  font-weight: 600;
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
  cursor: pointer;
}

.provider:hover {
  background: var(--id-surface-hover);
  border-color: var(--id-text-muted);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .facts {
    grid-template-columns: 1fr;
  }
}
</style>