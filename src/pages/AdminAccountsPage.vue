<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdSiteShell from '@/components/IdSiteShell.vue'
import IdThemeToggle from '@/components/IdThemeToggle.vue'
import { identityAdminApi, isApiError, type AdminAccount } from '@/api/client'
import { useSession } from '@/composables/useSession'

/**
 * 管理员后台 · 账号管理。
 *
 * 三件事：搜索分页浏览、改角色、重置口令。
 * 设计上的两条硬约束（与后端契约一致）：
 *   1. 列表里的 passwordAlgorithm 只是算法标签，界面**永远不显示**哈希本体；
 *   2. 重置口令返回的临时口令只出现一次，离开本页即不可再取，所以做成需要手动关闭的提示。
 */
const router = useRouter()
const session = useSession()

const accounts = ref<AdminAccount[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const keyword = ref('')
const loading = ref(true)
const error = ref('')
const notice = ref('')
/** 刚生成的临时口令：{ 用户名, 口令 }，关闭提示后清空。 */
const tempPassword = ref<{ username: string; value: string } | null>(null)
const busy = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await identityAdminApi.accounts(keyword.value.trim(), page.value, pageSize)
    accounts.value = result.items
    total.value = result.total
  } catch (caught) {
    // 403 说明当前账号不在 Authorization:Admins 名单里——这比「加载失败」更需要说清楚
    error.value = isApiError(caught) ? caught.detail : '加载失败，请稍后重试'
    accounts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  void load()
}

function goPage(next: number) {
  if (next < 1 || next > totalPages.value) return
  page.value = next
  void load()
}

async function changeRole(account: AdminAccount, role: string) {
  busy.value = account.id + ':role'
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.setRole(account.id, role === '' ? null : role)
    notice.value = `已将 ${account.username} 的角色改为 ${role || '普通用户'}`
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '修改失败'
  } finally {
    busy.value = ''
  }
}

async function resetPassword(account: AdminAccount) {
  const ok = window.confirm(
    `确定重置「${account.username}」的口令吗？\n\n原口令将立即失效，系统会生成一次性临时口令。`,
  )
  if (!ok) return

  busy.value = account.id + ':reset'
  error.value = ''
  notice.value = ''
  try {
    const value = await identityAdminApi.resetPassword(account.id)
    tempPassword.value = { username: account.username, value }
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '重置失败'
  } finally {
    busy.value = ''
  }
}

async function copyTempPassword() {
  if (!tempPassword.value) return
  try {
    await navigator.clipboard.writeText(tempPassword.value.value)
    notice.value = '临时口令已复制到剪贴板'
  } catch {
    notice.value = '复制失败，请手动选中复制'
  }
}

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

function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

async function logout() {
  await session.clear()
  await router.replace('/login')
}
</script>

<template>
  <IdSiteShell>
    <template #nav>
      <button type="button" class="nav-action" @click="router.push('/account')">我的账户</button>
      <button type="button" class="nav-action" @click="router.push('/admin/providers')">登录方式</button>
      <IdThemeToggle />
      <button type="button" class="nav-action" @click="logout">退出登录</button>
    </template>

    <header class="head">
      <div>
        <h1 class="head__title">账号管理</h1>
        <p class="head__sub">共 {{ total }} 个账号 · 第 {{ page }} / {{ totalPages }} 页</p>
      </div>
      <form class="search" @submit.prevent="search">
        <input
          v-model="keyword"
          class="search__input"
          type="search"
          placeholder="搜索用户名 / 邮箱 / 身份标识"
          aria-label="搜索账号"
        />
        <IdButton type="submit" size="sm">搜索</IdButton>
      </form>
    </header>

    <IdAlert v-if="tempPassword" variant="warning" title="临时口令（只显示这一次）">
      <p class="temp">
        <strong>{{ tempPassword.username }}</strong> 的新临时口令：
        <code class="temp__value">{{ tempPassword.value }}</code>
      </p>
      <p class="temp__hint">请立刻转告用户，并提醒其登录后立即修改口令。关闭本提示后将无法再次查看。</p>
      <div class="temp__actions">
        <IdButton size="sm" @click="copyTempPassword">复制口令</IdButton>
        <IdButton variant="secondary" size="sm" @click="tempPassword = null">我已记下，关闭</IdButton>
      </div>
    </IdAlert>

    <IdAlert v-if="error" variant="error" title="操作未完成">{{ error }}</IdAlert>
    <IdAlert v-if="notice" variant="info">{{ notice }}</IdAlert>

    <p v-if="loading" class="loading">加载中…</p>

    <template v-else>
      <IdAlert v-if="!accounts.length" variant="info" title="没有匹配的账号">
        换个关键词试试，或清空搜索查看全部。
      </IdAlert>

      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">账号</th>
              <th scope="col">邮箱</th>
              <th scope="col">登录方式</th>
              <th scope="col">角色</th>
              <th scope="col">注册 / 最近登录</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>
                <span class="name">{{ account.username }}</span>
                <span class="mono" :title="account.id">#{{ shortId(account.id) }}</span>
              </td>
              <td class="muted">{{ account.email || '未绑定' }}</td>
              <td>
                <span class="tag" :class="account.hasPassword ? 'tag--ok' : 'tag--warn'">
                  {{ account.hasPassword ? `口令（${account.passwordAlgorithm}）` : '无口令' }}
                </span>
                <span v-if="account.bindingCount" class="tag">第三方 ×{{ account.bindingCount }}</span>
              </td>
              <td>
                <select
                  class="select"
                  :value="account.role ?? ''"
                  :disabled="busy === account.id + ':role'"
                  :aria-label="`修改 ${account.username} 的角色`"
                  @change="changeRole(account, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">普通用户</option>
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td class="muted">
                <div>{{ formatTime(account.createdAt) }}</div>
                <div>{{ formatTime(account.lastLoginAt) }}</div>
              </td>
              <td>
                <IdButton
                  variant="secondary"
                  size="sm"
                  :loading="busy === account.id + ':reset'"
                  @click="resetPassword(account)"
                >
                  重置口令
                </IdButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav v-if="totalPages > 1" class="pager" aria-label="分页">
        <IdButton variant="secondary" size="sm" :disabled="page <= 1" @click="goPage(page - 1)">上一页</IdButton>
        <span class="pager__text">{{ page }} / {{ totalPages }}</span>
        <IdButton variant="secondary" size="sm" :disabled="page >= totalPages" @click="goPage(page + 1)">
          下一页
        </IdButton>
      </nav>
    </template>
  </IdSiteShell>
</template>

<style scoped>
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

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--id-space-4);
  padding: var(--id-space-5) 0 var(--id-space-4);
}

.head__title {
  font-size: var(--id-font-subtitle);
  font-weight: 600;
  color: var(--id-text);
}

.head__sub {
  margin-top: 4px;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.search {
  display: flex;
  gap: var(--id-space-2);
}

.search__input {
  min-width: 260px;
  height: var(--id-control-height);
  padding: 0 10px;
  font-size: var(--id-font-body);
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
  outline: none;
}

.search__input:focus {
  border-color: var(--id-accent);
}

.loading,
.muted {
  color: var(--id-text-muted);
}

.table-wrap {
  overflow-x: auto;
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-card);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--id-font-body);
}

.table th {
  padding: 10px var(--id-space-4);
  font-size: var(--id-font-small);
  font-weight: 500;
  color: var(--id-text-muted);
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--id-border);
}

.table td {
  padding: 10px var(--id-space-4);
  color: var(--id-text-body);
  vertical-align: top;
  border-bottom: 1px solid var(--id-border);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.name {
  display: block;
  font-weight: 500;
  color: var(--id-text);
}

.mono {
  font-family: var(--id-font-mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--id-text-faint);
}

.tag {
  display: inline-block;
  margin-right: 4px;
  padding: 1px 6px;
  font-size: 11px;
  color: var(--id-text-muted);
  background: var(--id-surface-sunken);
  border-radius: var(--id-radius-pill);
}

.tag--ok {
  color: var(--id-success);
  background: var(--id-success-soft);
}

.tag--warn {
  color: var(--id-warning);
  background: var(--id-warning-soft);
}

.select {
  height: 28px;
  padding: 0 6px;
  font-size: var(--id-font-small);
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
}

.temp {
  margin: var(--id-space-2) 0;
  font-size: var(--id-font-body);
}

.temp__value {
  display: inline-block;
  padding: 2px 8px;
  font-family: ui-monospace, monospace;
  font-size: 14px;
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border-radius: var(--id-radius-field);
  user-select: all;
}

.temp__hint {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.temp__actions {
  display: flex;
  gap: var(--id-space-2);
  margin-top: var(--id-space-3);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--id-space-3);
  padding: var(--id-space-5) 0;
}

.pager__text {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}
</style>
