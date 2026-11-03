<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdSiteShell from '@/components/IdSiteShell.vue'
import IdThemeToggle from '@/components/IdThemeToggle.vue'
import {
  identityAdminApi,
  isApiError,
  type AdminAccount,
  type SiteRole,
} from '@/api/client'
import { useSession } from '@/composables/useSession'

/**
 * 管理员后台 · 账号管理。
 *
 * 五件事：搜索分页浏览、建号、改角色、停用/启用、重置口令，以及分站职权与第三方解绑。
 * 设计上的硬约束（与后端契约一致）：
 *   1. 列表里的 passwordAlgorithm 只是算法标签，界面**永远不显示**哈希本体；
 *   2. 重置口令返回的临时口令只出现一次，离开本页即不可再取，所以做成需要手动关闭的提示；
 *   3. **能进这个页面 ≠ 能管所有站**：这里改的是「站点职权」，一个人可以只在某一个站是管理员。
 *      判断当前账号是否管理员由后端说了算（profile.isAdmin），前端不用 role 推断。
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

/* ===== 建号 ===== */
const creating = ref(false)
const createForm = ref({ username: '', email: '', password: '' })

/* ===== 分站职权（展开在行下方） ===== */
/** 当前展开职权的账号 Id；null = 没有展开。 */
const rolePanelFor = ref<string | null>(null)
const roleSites = ref<string[]>([])
const roleLoading = ref(false)
const roleBySite = ref<Record<string, string>>({})
const roleBusy = ref('')

/* ===== 第三方绑定（展开在行下方） ===== */
const bindingPanelFor = ref<string | null>(null)
const bindingProviders = ref<string[]>([])
const bindingLoading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

onMounted(load)

/* ===== 建号 ===== */
function toggleCreate() {
  creating.value = !creating.value
  error.value = ''
  notice.value = ''
  if (creating.value) createForm.value = { username: '', email: '', password: '' }
}

async function submitCreate() {
  const username = createForm.value.username.trim()
  if (!username || !createForm.value.password) {
    error.value = '用户名与口令都必须填写'
    return
  }

  busy.value = 'create'
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.createAccount({
      username,
      email: createForm.value.email.trim() || null,
      password: createForm.value.password,
    })
    notice.value = `账号 ${username} 已创建。请把口令转告本人，并提醒其登录后立即修改。`
    creating.value = false
    page.value = 1
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '创建失败'
  } finally {
    busy.value = ''
  }
}

/* ===== 停用 / 启用 ===== */
async function toggleStatus(account: AdminAccount) {
  const disabling = account.status !== 'disabled'
  if (disabling) {
    const ok = window.confirm(
      `确定停用「${account.username}」吗？\n\n停用后该账号立即无法登录，已登录的会话也会立刻失效。数据不会删除，随时可以重新启用。`,
    )
    if (!ok) return
  }

  busy.value = account.id + ':status'
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.setStatus(account.id, disabling ? 'disabled' : 'active')
    notice.value = disabling ? `已停用 ${account.username}` : `已启用 ${account.username}`
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '操作失败'
  } finally {
    busy.value = ''
  }
}

/* ===== 分站职权 ===== */
async function toggleRoles(account: AdminAccount) {
  if (rolePanelFor.value === account.id) {
    rolePanelFor.value = null
    return
  }

  rolePanelFor.value = account.id
  bindingPanelFor.value = null
  roleLoading.value = true
  error.value = ''
  try {
    const result = await identityAdminApi.roles(account.id)
    roleSites.value = result.sites
    roleBySite.value = Object.fromEntries(result.roles.map((item: SiteRole) => [item.site, item.role]))
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '读取职权失败'
    roleSites.value = []
    roleBySite.value = {}
  } finally {
    roleLoading.value = false
  }
}

async function setSiteRole(account: AdminAccount, site: string, role: string) {
  roleBusy.value = account.id + ':' + site
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.setSiteRole(account.id, site, role === '' ? null : role)
    const next = { ...roleBySite.value }
    if (role === '') delete next[site]
    else next[site] = role
    roleBySite.value = next
    notice.value =
      role === ''
        ? `已撤销 ${account.username} 在 ${site} 的职权`
        : `已授予 ${account.username} 在 ${site} 的 ${role} 职权`
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '修改失败'
  } finally {
    roleBusy.value = ''
  }
}

/* ===== 第三方绑定 ===== */
async function toggleBindings(account: AdminAccount) {
  if (bindingPanelFor.value === account.id) {
    bindingPanelFor.value = null
    return
  }

  bindingPanelFor.value = account.id
  rolePanelFor.value = null
  bindingLoading.value = true
  error.value = ''
  try {
    const detail = await identityAdminApi.account(account.id)
    bindingProviders.value = detail.providers
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '读取绑定失败'
    bindingProviders.value = []
  } finally {
    bindingLoading.value = false
  }
}

async function unbind(account: AdminAccount, provider: string) {
  const ok = window.confirm(
    `确定解绑「${account.username}」的 ${provider} 登录吗？\n\n若这是该账号唯一的登录方式，服务端会拒绝这次解绑。`,
  )
  if (!ok) return

  busy.value = account.id + ':unbind:' + provider
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.unbind(account.id, provider)
    notice.value = `已解绑 ${provider}`
    const detail = await identityAdminApi.account(account.id)
    bindingProviders.value = detail.providers
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '解绑失败'
  } finally {
    busy.value = ''
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await identityAdminApi.accounts(keyword.value.trim(), page.value, pageSize)
    accounts.value = result.items
    total.value = result.total
  } catch (caught) {
    // 403 说明当前账号没有 identity 站点职权——这比「加载失败」更需要说清楚
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
      <div class="head__actions">
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
        <IdButton size="sm" @click="toggleCreate">
          {{ creating ? '取消' : '新建账号' }}
        </IdButton>
      </div>
    </header>

    <section v-if="creating" class="create">
      <h2 class="create__title">新建账号</h2>
      <p class="create__hint">
        注册走邮箱验证码；收不到信的人由管理员在这里开号。口令强度与自助注册同一套，
        建出来的账号默认可用、<strong>无任何站点职权</strong>。
      </p>
      <form class="create__form" @submit.prevent="submitCreate">
        <label class="create__field">
          <span>用户名</span>
          <input v-model="createForm.username" class="create__input" type="text" required />
        </label>
        <label class="create__field">
          <span>邮箱（可空）</span>
          <input v-model="createForm.email" class="create__input" type="email" />
        </label>
        <label class="create__field">
          <span>初始口令</span>
          <input v-model="createForm.password" class="create__input" type="text" required />
        </label>
        <IdButton type="submit" size="sm" :loading="busy === 'create'">创建</IdButton>
      </form>
    </section>

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
              <th scope="col">状态</th>
              <th scope="col">邮箱</th>
              <th scope="col">登录方式</th>
              <th scope="col">角色（OIDC）</th>
              <th scope="col">注册 / 最近登录</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="account in accounts" :key="account.id">
            <tr :class="{ 'row--disabled': account.status === 'disabled' }">
              <td>
                <span class="name">{{ account.username }}</span>
                <span class="mono" :title="account.id">#{{ shortId(account.id) }}</span>
              </td>
              <td>
                <span class="tag" :class="account.status === 'disabled' ? 'tag--danger' : 'tag--ok'">
                  {{ account.status === 'disabled' ? '已停用' : '正常' }}
                </span>
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
              <td class="actions">
                <IdButton
                  variant="secondary"
                  size="sm"
                  :loading="busy === account.id + ':reset'"
                  @click="resetPassword(account)"
                >
                  重置口令
                </IdButton>
                <IdButton variant="secondary" size="sm" @click="toggleRoles(account)">
                  {{ rolePanelFor === account.id ? '收起职权' : '站点职权' }}
                </IdButton>
                <IdButton
                  v-if="account.bindingCount"
                  variant="secondary"
                  size="sm"
                  @click="toggleBindings(account)"
                >
                  {{ bindingPanelFor === account.id ? '收起绑定' : '绑定' }}
                </IdButton>
                <IdButton
                  :variant="account.status === 'disabled' ? 'primary' : 'secondary'"
                  size="sm"
                  :loading="busy === account.id + ':status'"
                  @click="toggleStatus(account)"
                >
                  {{ account.status === 'disabled' ? '启用' : '停用' }}
                </IdButton>
              </td>
            </tr>

            <tr v-if="rolePanelFor === account.id" class="panel-row">
              <td colspan="7">
                <div class="panel">
                  <p class="panel__title">站点职权</p>
                  <p class="panel__hint">
                    只授予该站点后台的访问权。<strong>能进这个页面 ≠ 能管所有站</strong>：
                    一个人可以只在某一个站是管理员。撤销即取消该站权限，立即生效。
                  </p>
                  <p v-if="roleLoading" class="muted">加载中…</p>
                  <div v-else class="panel__grid">
                    <label v-for="site in roleSites" :key="site" class="panel__field">
                      <span class="mono">{{ site }}</span>
                      <select
                        class="select"
                        :value="roleBySite[site] ?? ''"
                        :disabled="roleBusy === account.id + ':' + site"
                        :aria-label="`设置 ${account.username} 在 ${site} 的职权`"
                        @change="setSiteRole(account, site, ($event.target as HTMLSelectElement).value)"
                      >
                        <option value="">无职权</option>
                        <option value="admin">admin</option>
                      </select>
                    </label>
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="bindingPanelFor === account.id" class="panel-row">
              <td colspan="7">
                <div class="panel">
                  <p class="panel__title">第三方绑定</p>
                  <p class="panel__hint">
                    解绑后该方式不能再用来登录。若这是账号<strong>唯一</strong>的登录方式，
                    服务端会拒绝解绑（否则本人既没有口令、也收不到找回邮件）。
                  </p>
                  <p v-if="bindingLoading" class="muted">加载中…</p>
                  <p v-else-if="!bindingProviders.length" class="muted">没有已绑定的第三方。</p>
                  <ul v-else class="panel__list">
                    <li v-for="provider in bindingProviders" :key="provider" class="panel__item">
                      <span class="mono">{{ provider }}</span>
                      <IdButton
                        variant="secondary"
                        size="sm"
                        :loading="busy === account.id + ':unbind:' + provider"
                        @click="unbind(account, provider)"
                      >
                        解绑
                      </IdButton>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
            </template>
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

.tag--danger {
  color: var(--id-danger);
  background: var(--id-danger-soft);
}

.row--disabled td {
  opacity: 0.62;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.head__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--id-space-2);
}

.create {
  margin-bottom: var(--id-space-4);
  padding: var(--id-space-4);
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-card);
}

.create__title {
  font-size: var(--id-font-body);
  font-weight: 600;
  color: var(--id-text);
}

.create__hint {
  margin: 6px 0 var(--id-space-3);
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.create__form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--id-space-3);
}

.create__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.create__input {
  min-width: 180px;
  height: var(--id-control-height);
  padding: 0 10px;
  font-size: var(--id-font-body);
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
  outline: none;
}

.create__input:focus {
  border-color: var(--id-accent);
}

.panel-row td {
  padding: 0;
  background: var(--id-surface-sunken);
}

.panel {
  padding: var(--id-space-4);
}

.panel__title {
  font-size: var(--id-font-body);
  font-weight: 600;
  color: var(--id-text);
}

.panel__hint {
  margin: 6px 0 var(--id-space-3);
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--id-space-3);
}

.panel__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-2);
}

.panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-2);
}
</style>
