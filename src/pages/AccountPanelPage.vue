<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdDivider from '@/components/IdDivider.vue'
import IdLayout from '@/components/IdLayout.vue'
import IdThemeToggle from '@/components/IdThemeToggle.vue'
import { identityApi, type AccountProfile, type ExternalProvider } from '@/api/client'

/**
 * 账户面板：对应参考站的 Dashboard —— 顶部身份条 + 资料表格 + 已绑定服务 + 设置。
 *
 * 数据来自 GET /identity/account/profile（服务端会话 Cookie 鉴权），
 * 所以这里展示的是**真实账户资料**，不是从 token 里猜的。
 */
const emit = defineEmits<{ changePassword: []; login: [] }>()

const profile = ref<AccountProfile | null>(null)
const providers = ref<ExternalProvider[]>([])
const loading = ref(true)
const message = ref('')
const busy = ref('')

const unbound = computed(() => {
  const bound = new Set((profile.value?.bindings ?? []).map((item) => item.provider))
  return providers.value.filter((provider) => !bound.has(provider.name))
})

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

/** 时间统一按北京时间展示（后端存 UTC）。 */
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

/** 邮箱脱敏：本人看自己的资料，但公开卡片照抄参考站的做法只露一部分。 */
function maskEmail(email?: string | null): string {
  if (!email) return '未绑定'
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  if (name.length <= 2) return `${name[0] ?? ''}***@${domain}`
  return `${name.slice(0, 2)}***@${domain}`
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
    message.value = `已解绑`
    await load()
  } catch {
    message.value = '网络异常，请稍后重试'
  } finally {
    busy.value = ''
  }
}

async function logout() {
  await identityApi.logout()
  window.location.assign('/login')
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <p class="id-eyebrow">云术身份中心</p>
        <h1 class="id-card-title">账户面板</h1>
      </template>

      <p v-if="loading" class="id-loading">加载中…</p>

      <template v-else-if="profile">
        <!-- 身份条：头像 + 用户名 + 编号 + 邮箱 -->
        <div class="id-identity">
          <span class="id-avatar" aria-hidden="true">{{ initials(profile.username) }}</span>
          <div class="id-identity__text">
            <p class="id-identity__name">
              {{ profile.username }}
              <span v-if="profile.role" class="id-chip">{{ profile.role }}</span>
            </p>
            <p class="id-identity__meta">{{ maskEmail(profile.email) }}</p>
          </div>
        </div>

        <!-- 资料表格：两列，与参考站 Dashboard 的字段节奏一致 -->
        <dl class="id-facts">
          <div class="id-fact id-fact--wide">
            <dt>账户 ID</dt>
            <dd class="id-fact__mono" :title="profile.id">{{ profile.id }}</dd>
          </div>
          <div class="id-fact">
            <dt>账户状态</dt>
            <dd>
              <span class="id-status" :class="profile.hasLocalPassword ? 'is-ok' : 'is-partial'">
                {{ profile.hasLocalPassword ? '正常' : '仅第三方登录' }}
              </span>
            </dd>
          </div>
          <div class="id-fact">
            <dt>注册时间</dt>
            <dd>{{ formatTime(profile.createdAt) }}</dd>
          </div>
          <div class="id-fact">
            <dt>最近登录</dt>
            <dd>{{ formatTime(profile.lastLoginAt) }}</dd>
          </div>
          <div class="id-fact">
            <dt>绑定邮箱</dt>
            <dd>{{ profile.email || '未绑定' }}</dd>
          </div>
          <div class="id-fact">
            <dt>登录方式</dt>
            <dd>{{ profile.hasLocalPassword ? '口令 + 第三方' : '仅第三方' }}</dd>
          </div>
        </dl>

        <IdDivider />

        <!-- 已绑定的第三方 -->
        <section class="id-section">
          <h2 class="id-section__title">已关联的登录方式</h2>
          <p v-if="!profile.bindings.length" class="id-muted">还没有绑定任何第三方账号。</p>
          <ul v-else class="id-bindings">
            <li v-for="binding in profile.bindings" :key="binding.provider" class="id-binding">
              <span class="id-binding__main">
                <span class="id-binding__name">{{ binding.providerName }}</span>
                <span class="id-binding__time">绑定于 {{ formatTime(binding.createdAt) }}</span>
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
          </ul>

          <template v-if="unbound.length">
            <p class="id-muted">可绑定：</p>
            <div class="id-providers">
              <button
                v-for="provider in unbound"
                :key="provider.name"
                type="button"
                class="id-provider"
                @click="identityApi.startExternalLogin(provider.name, '/account')"
              >
                {{ provider.displayName }}
              </button>
            </div>
          </template>
        </section>

        <IdAlert v-if="message" variant="info">{{ message }}</IdAlert>

        <IdDivider />

        <section class="id-section">
          <h2 class="id-section__title">设置</h2>
          <div class="id-actions">
            <IdButton variant="secondary" size="sm" @click="emit('changePassword')">修改口令</IdButton>
            <IdButton variant="ghost" size="sm" @click="logout">退出登录</IdButton>
          </div>
        </section>

        <IdDivider />

        <section class="id-section id-section--inline">
          <h2 class="id-section__title">外观</h2>
          <IdThemeToggle />
        </section>
      </template>

      <template v-else>
        <IdAlert variant="info" title="尚未登录">请先登录后查看账户信息。</IdAlert>
        <div class="id-actions id-actions--center">
          <IdButton @click="emit('login')">去登录</IdButton>
        </div>
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.id-eyebrow {
  margin-bottom: var(--id-space-1);
  font-size: var(--id-font-small);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--id-text-muted);
}

.id-card-title {
  font-size: var(--id-font-subtitle);
  font-weight: 600;
  color: var(--id-text);
}

.id-loading {
  color: var(--id-text-muted);
  font-size: var(--id-font-body);
}

.id-identity {
  display: flex;
  align-items: center;
  gap: var(--id-space-3);
  margin-bottom: var(--id-space-5);
}

.id-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--id-accent-soft);
  border: 1px solid var(--id-border-strong);
  color: var(--id-accent);
  font-size: var(--id-font-subtitle);
  font-weight: 600;
}

.id-identity__name {
  display: flex;
  align-items: center;
  gap: var(--id-space-2);
  font-size: var(--id-font-body);
  font-weight: 600;
  color: var(--id-text);
}

.id-identity__meta {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.id-chip {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  color: var(--id-accent);
  background: var(--id-accent-soft);
  border-radius: 2px;
}

/* 资料表格：两列网格，标签在上、值在下（参考站 Dashboard 的信息块） */
.id-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--id-space-4) var(--id-space-5);
  margin: 0;
}

.id-fact--wide {
  grid-column: 1 / -1;
}

.id-fact dt {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.id-fact dd {
  margin: 2px 0 0;
  font-size: var(--id-font-body);
  color: var(--id-text);
  word-break: break-all;
}

.id-fact__mono {
  font-family: 'Cascadia Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px !important;
  /* GUID 用 nowrap + 省略号，避免把两列网格撑歪 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.id-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--id-font-body);
}

.id-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.id-status.is-ok {
  color: var(--id-success);
}

.id-status.is-partial {
  color: var(--id-warning);
}

.id-section {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-3);
}

.id-section--inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.id-section__title {
  font-size: var(--id-font-small);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--id-text-muted);
}

.id-muted {
  font-size: var(--id-font-small);
  color: var(--id-text-faint);
}

.id-bindings {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.id-binding {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-3);
  padding: var(--id-space-2) var(--id-space-3);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
}

.id-binding__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.id-binding__name {
  font-size: var(--id-font-body);
  color: var(--id-text);
}

.id-binding__time {
  font-size: var(--id-font-small);
  color: var(--id-text-faint);
}

.id-providers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--id-space-2);
}

.id-provider {
  height: 30px;
  padding: 0 var(--id-space-3);
  font-size: var(--id-font-small);
  font-weight: 600;
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
  cursor: pointer;
  transition: background-color var(--id-transition), border-color var(--id-transition);
}

.id-provider:hover {
  background: var(--id-surface-hover);
  border-color: var(--id-text-muted);
}

.id-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--id-space-2);
}

.id-actions--center {
  justify-content: center;
  margin-top: var(--id-space-4);
}

@media (max-width: 520px) {
  .id-facts {
    grid-template-columns: 1fr;
  }
}
</style>