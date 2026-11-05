<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconAdd,
  IconBlock,
  IconCheckCircle,
  IconDomain,
  IconKey,
  IconLink,
  IconLogout,
  IconManageAccounts,
  IconPerson,
  IconRefresh,
  IconSearch,
} from '@/icons'
import { M3Button, M3Card, M3Chip, M3IconButton, M3Tooltip } from '@cloudery/m3-ui'
import IdAlert from '@/components/IdAlert.vue'
import IdConfirmDialog, { type ConfirmOptions } from '@/components/identity/IdConfirmDialog.vue'
import IdField from '@/components/IdField.vue'
import IdPageHeader from '@/components/identity/IdPageHeader.vue'
import IdSelect, { type SelectOption } from '@/components/identity/IdSelect.vue'
import IdSiteShell from '@/components/IdSiteShell.vue'
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

const confirmRef = ref<InstanceType<typeof IdConfirmDialog> | null>(null)

async function askConfirm(options: ConfirmOptions): Promise<boolean> {
  return (await confirmRef.value?.ask(options)) ?? false
}

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

const roleOptions: SelectOption[] = [
  { value: '', label: '普通用户' },
  { value: 'member', label: 'member' },
  { value: 'admin', label: 'admin' },
]

const siteRoleOptions: SelectOption[] = [
  { value: '', label: '无职权' },
  { value: 'admin', label: 'admin' },
]

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
    notice.value = '账号 ' + username + ' 已创建。请把口令转告本人，并提醒其登录后立即修改。'
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
    const ok = await askConfirm({
      title: '停用「' + account.username + '」？',
      body: [
        '停用后该账号立即无法登录，已登录的会话也会立刻失效。',
        '数据不会删除，随时可以重新启用。',
      ],
      confirmLabel: '停用账号',
      danger: true,
    })
    if (!ok) return
  }

  busy.value = account.id + ':status'
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.setStatus(account.id, disabling ? 'disabled' : 'active')
    notice.value = disabling ? '已停用 ' + account.username : '已启用 ' + account.username
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
        ? '已撤销 ' + account.username + ' 在 ' + site + ' 的职权'
        : '已授予 ' + account.username + ' 在 ' + site + ' 的 ' + role + ' 职权'
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
  const ok = await askConfirm({
    title: '解绑「' + account.username + '」的 ' + provider + ' 登录？',
    body: '若这是该账号唯一的登录方式，服务端会拒绝这次解绑。',
    confirmLabel: '解绑',
    danger: true,
  })
  if (!ok) return

  busy.value = account.id + ':unbind:' + provider
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.unbind(account.id, provider)
    notice.value = '已解绑 ' + provider
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
    notice.value = '已将 ' + account.username + ' 的角色改为 ' + (role || '普通用户')
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '修改失败'
  } finally {
    busy.value = ''
  }
}

async function resetPassword(account: AdminAccount) {
  const ok = await askConfirm({
    title: '重置「' + account.username + '」的口令？',
    body: '原口令将立即失效，系统会生成一次性临时口令。',
    confirmLabel: '重置口令',
    danger: true,
  })
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
      <M3Button variant="text" size="sm" :icon="IconPerson" @click="router.push('/account')">
        我的账户
      </M3Button>
      <M3Button variant="text" size="sm" :icon="IconLink" @click="router.push('/admin/providers')">
        登录方式
      </M3Button>
      <M3IconButton :icon="IconLogout" label="退出登录" @click="logout" />
    </template>

    <IdPageHeader
      title="账号管理"
      eyebrow="管理后台"
      :icon="IconManageAccounts"
      :description="'共 ' + total + ' 个账号 · 第 ' + page + ' / ' + totalPages + ' 页'"
    >
      <template #actions>
        <M3Button :icon="creating ? undefined : IconAdd" @click="toggleCreate">
          {{ creating ? '取消' : '新建账号' }}
        </M3Button>
        <M3IconButton :icon="IconRefresh" label="刷新列表" @click="load" />
      </template>
    </IdPageHeader>

    <!-- 检索栏：MD3 把搜索放在内容区的第一行，而不是挤进标题栏 -->
    <div class="toolbar">
      <form class="toolbar__search" @submit.prevent="search">
        <IdField
          v-model="keyword"
          label="搜索账号"
          placeholder="用户名 / 邮箱 / 身份标识"
          inputmode="search"
          clearable
        />
        <M3Button type="submit" variant="tonal" :icon="IconSearch">搜索</M3Button>
      </form>
    </div>

    <M3Card v-if="creating" variant="filled" shape="large" class="create">
      <h2 class="create__title md-typescale-title-medium">新建账号</h2>
      <p class="create__hint md-typescale-body-medium">
        注册走邮箱验证码；收不到信的人由管理员在这里开号。口令强度与自助注册同一套，
        建出来的账号默认可用、<strong>无任何站点职权</strong>。
      </p>
      <form class="create__form" @submit.prevent="submitCreate">
        <IdField v-model="createForm.username" label="用户名" placeholder="登录名" required />
        <IdField v-model="createForm.email" label="邮箱（可空）" type="email" placeholder="example@example.com" />
        <IdField v-model="createForm.password" label="初始口令" placeholder="转告本人后请提醒其修改" required />
        <M3Button type="submit" :loading="busy === 'create'">创建</M3Button>
      </form>
    </M3Card>

    <IdAlert v-if="tempPassword" variant="warning" title="临时口令（只显示这一次）" dismissible @dismiss="tempPassword = null">
      <p class="temp">
        <strong>{{ tempPassword.username }}</strong> 的新临时口令：
        <code class="temp__value">{{ tempPassword.value }}</code>
      </p>
      <p class="temp__hint">请立刻转告用户，并提醒其登录后立即修改口令。关闭本提示后将无法再次查看。</p>
      <div class="temp__actions">
        <M3Button size="sm" variant="tonal" @click="copyTempPassword">复制口令</M3Button>
        <M3Button size="sm" variant="text" @click="tempPassword = null">我已记下</M3Button>
      </div>
    </IdAlert>

    <div class="alerts">
      <IdAlert v-if="error" variant="error" title="操作未完成" dismissible @dismiss="error = ''">
        {{ error }}
      </IdAlert>
      <IdAlert v-if="notice" variant="success" dismissible @dismiss="notice = ''">{{ notice }}</IdAlert>
    </div>

    <p v-if="loading" class="loading md-typescale-body-medium">加载中…</p>

    <IdAlert v-else-if="!accounts.length" variant="info" title="没有匹配的账号">
      换个关键词试试，或清空搜索查看全部。
    </IdAlert>

    <template v-else>
      <M3Card variant="filled" shape="large" class="table-card">
        <div class="table-wrap">
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
                    <span class="cell-name md-typescale-body-large">{{ account.username }}</span>
                    <span class="cell-id id-mono" :title="account.id">#{{ shortId(account.id) }}</span>
                  </td>
                  <td>
                    <M3Chip
                      variant="assist"
                      :icon="account.status === 'disabled' ? IconBlock : IconCheckCircle"
                      :label="account.status === 'disabled' ? '已停用' : '正常'"
                    />
                  </td>
                  <td class="cell-muted">{{ account.email || '未绑定' }}</td>
                  <td>
                    <div class="chips">
                      <M3Chip
                        variant="assist"
                        :icon="account.hasPassword ? IconKey : IconBlock"
                        :label="account.hasPassword ? '口令（' + (account.passwordAlgorithm ?? '未知') + '）' : '无口令'"
                      />
                      <M3Chip
                        v-if="account.bindingCount"
                        variant="assist"
                        :icon="IconLink"
                        :label="'第三方 ×' + account.bindingCount"
                      />
                    </div>
                  </td>
                  <td>
                    <IdSelect
                      class="role-select"
                      :model-value="account.role ?? ''"
                      :options="roleOptions"
                      label="角色"
                      :disabled="busy === account.id + ':role'"
                      @update:model-value="(value) => changeRole(account, value)"
                    />
                  </td>
                  <td class="cell-muted">
                    <div>{{ formatTime(account.createdAt) }}</div>
                    <div>{{ formatTime(account.lastLoginAt) }}</div>
                  </td>
                  <td>
                    <div class="actions">
                      <M3Tooltip text="重置口令" placement="top">
                        <M3IconButton
                          :icon="IconKey"
                          label="重置口令"
                          variant="tonal"
                          size="sm"
                          :disabled="busy === account.id + ':reset'"
                          @click="resetPassword(account)"
                        />
                      </M3Tooltip>

                      <M3Tooltip :text="rolePanelFor === account.id ? '收起站点职权' : '站点职权'" placement="top">
                        <M3IconButton
                          :icon="IconDomain"
                          :label="rolePanelFor === account.id ? '收起站点职权' : '站点职权'"
                          :variant="rolePanelFor === account.id ? 'filled' : 'outlined'"
                          size="sm"
                          @click="toggleRoles(account)"
                        />
                      </M3Tooltip>

                      <M3Tooltip v-if="account.bindingCount" text="第三方绑定" placement="top">
                        <M3IconButton
                          :icon="IconLink"
                          label="第三方绑定"
                          :variant="bindingPanelFor === account.id ? 'filled' : 'outlined'"
                          size="sm"
                          @click="toggleBindings(account)"
                        />
                      </M3Tooltip>

                      <M3Tooltip
                        :text="account.status === 'disabled' ? '启用账号' : '停用账号'"
                        placement="top"
                      >
                        <M3IconButton
                          :icon="account.status === 'disabled' ? IconCheckCircle : IconBlock"
                          :label="account.status === 'disabled' ? '启用账号' : '停用账号'"
                          :variant="account.status === 'disabled' ? 'filled' : 'standard'"
                          size="sm"
                          :disabled="busy === account.id + ':status'"
                          @click="toggleStatus(account)"
                        />
                      </M3Tooltip>
                    </div>
                  </td>
                </tr>

                <tr v-if="rolePanelFor === account.id" class="panel-row">
                  <td colspan="7">
                    <div class="panel">
                      <p class="panel__title md-typescale-title-small">站点职权</p>
                      <p class="panel__hint md-typescale-body-small">
                        只授予该站点后台的访问权。<strong>能进这个页面 ≠ 能管所有站</strong>：
                        一个人可以只在某一个站是管理员。撤销即取消该站权限，立即生效。
                      </p>
                      <p v-if="roleLoading" class="cell-muted">加载中…</p>
                      <div v-else class="panel__grid">
                        <div v-for="site in roleSites" :key="site" class="panel__field">
                          <span class="panel__site id-mono">{{ site }}</span>
                          <IdSelect
                            class="role-select"
                            :model-value="roleBySite[site] ?? ''"
                            :options="siteRoleOptions"
                            label="职权"
                            :disabled="roleBusy === account.id + ':' + site"
                            @update:model-value="(value) => setSiteRole(account, site, value)"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr v-if="bindingPanelFor === account.id" class="panel-row">
                  <td colspan="7">
                    <div class="panel">
                      <p class="panel__title md-typescale-title-small">第三方绑定</p>
                      <p class="panel__hint md-typescale-body-small">
                        解绑后该方式不能再用来登录。若这是账号<strong>唯一</strong>的登录方式，
                        服务端会拒绝解绑（否则本人既没有口令、也收不到找回邮件）。
                      </p>
                      <p v-if="bindingLoading" class="cell-muted">加载中…</p>
                      <p v-else-if="!bindingProviders.length" class="cell-muted">没有已绑定的第三方。</p>
                      <ul v-else class="panel__list">
                        <li v-for="provider in bindingProviders" :key="provider" class="panel__item">
                          <span class="id-mono">{{ provider }}</span>
                          <M3Button
                            variant="outlined"
                            size="sm"
                            :loading="busy === account.id + ':unbind:' + provider"
                            @click="unbind(account, provider)"
                          >
                            解绑
                          </M3Button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </M3Card>

      <nav v-if="totalPages > 1" class="pager" aria-label="分页">
        <M3Button variant="outlined" size="sm" :disabled="page <= 1" @click="goPage(page - 1)">上一页</M3Button>
        <span class="pager__text md-typescale-label-large">{{ page }} / {{ totalPages }}</span>
        <M3Button variant="outlined" size="sm" :disabled="page >= totalPages" @click="goPage(page + 1)">
          下一页
        </M3Button>
      </nav>
    </template>

    <IdConfirmDialog ref="confirmRef" />
  </IdSiteShell>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-block-end: 16px;
}

.toolbar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(520px, 100%);
}

.toolbar__search :deep(.field) {
  flex: 1;
  min-width: 0;
}

.loading,
.cell-muted {
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}

.alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-block-end: 16px;
}

/* ---------- 建号 ---------- */
.create {
  margin-block-end: 16px;
}

.create__title {
  margin: 0 0 4px;
  color: var(--md-sys-color-on-surface);
}

.create__hint {
  margin: 0 0 16px;
  color: var(--md-sys-color-on-surface-variant);
}

.create__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: end;
}

/* ---------- 临时口令 ---------- */
.temp {
  margin: 4px 0;
}

.temp__value {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent);
  font-family: var(--md-ref-typeface-mono);
  user-select: all;
}

.temp__hint {
  margin: 0;
  opacity: 0.9;
}

.temp__actions {
  display: flex;
  gap: 8px;
  margin-block-start: 8px;
}

/* ---------- 表格 ---------- */
/* 表格卡片：MD3 没有 data table 组件，这里用容器色卡片 + 行分隔线，
   行悬浮走状态层，与列表项同一口径 */
.table-card {
  background-color: var(--md-sys-color-surface-container-low);
}

.table-card :deep(.md-card__content) {
  padding: 0;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.table th {
  padding: 10px 12px;
  border-block-end: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-title-small-size);
  font-weight: var(--md-sys-typescale-title-small-weight);
  letter-spacing: var(--md-sys-typescale-title-small-tracking);
  text-align: start;
  white-space: nowrap;
}

.table td {
  padding: 10px 12px;
  border-block-end: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
  vertical-align: top;
}

.table tbody tr:last-child td {
  border-block-end: none;
}

.table tbody tr {
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

@media (hover: hover) {
  .table tbody tr:hover {
    background-color: var(--md-sys-color-surface-container);
  }
}

.cell-name {
  display: block;
  color: var(--md-sys-color-on-surface);
}

.cell-id {
  display: block;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 表格里的下拉：保留 MD3 的 56dp 填充容器（压扁会让浮动标签压住值），
   只把底色提到容器层，和表格表面拉开一级 */
.role-select {
  min-width: 124px;
}

.role-select :deep(.select-field__container) {
  background-color: var(--md-sys-color-surface-container-highest);
}

/* 行操作收成图标按钮：一行放得下，行高不会再被按钮撑成三倍 */
.actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
}

.row--disabled td {
  opacity: 0.62;
}

/* ---------- 展开面板 ---------- */
.panel-row td {
  padding: 0;
  background-color: var(--md-sys-color-surface-container);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.panel__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.panel__hint {
  margin: 0;
  max-width: 80ch;
  color: var(--md-sys-color-on-surface-variant);
}

.panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.panel__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel__site {
  color: var(--md-sys-color-on-surface);
}

.panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* ---------- 分页 ---------- */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-block: 20px;
}

.pager__text {
  color: var(--md-sys-color-on-surface-variant);
}

@media (max-width: 720px) {
  .toolbar__search {
    width: 100%;
  }
}
</style>
