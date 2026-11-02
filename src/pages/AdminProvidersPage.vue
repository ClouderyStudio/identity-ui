<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdProviderForm, { type ProviderDraft } from '@/components/IdProviderForm.vue'
import IdSiteShell from '@/components/IdSiteShell.vue'
import IdThemeToggle from '@/components/IdThemeToggle.vue'
import {
  identityAdminApi,
  isApiError,
  type AdminProvider,
  type AdminProviderInput,
} from '@/api/client'

/**
 * 管理员后台 · 登录方式管理（自定义 OAuth2 提供方 + 彩虹聚合）。
 *
 * 安全约定（与后端一致，界面必须配合）：
 *   - 密钥**只写不读**：后端只回 hasSecret，所以编辑框永远是空输入框 + 「已配置/未配置」标签；
 *   - 编辑时密钥留空 = 保留原值，因此界面要明确写出这条，否则管理员会以为留空等于清除。
 */
const router = useRouter()

const items = ref<AdminProvider[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const busy = ref('')

/** 正在编辑的行；null 表示表单关闭。id 为空表示「新建」。 */
const editingId = ref<string | null>(null)
const formOpen = ref(false)

const draft = reactive<ProviderDraft>({
  name: '',
  displayName: '',
  kind: 'oauth2',
  enabled: true,
  icon: '',
  clientId: '',
  clientSecret: '',
  authorizeUrl: '',
  tokenUrl: '',
  userInfoUrl: '',
  scope: '',
  apiUrl: '',
  type: '',
  fieldMapping: '',
})

const isEditing = computed(() => editingId.value !== null)

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = await identityAdminApi.providers()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '加载失败，请稍后重试'
    items.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  draft.name = ''
  draft.displayName = ''
  draft.kind = 'oauth2'
  draft.enabled = true
  draft.icon = ''
  draft.clientId = ''
  draft.clientSecret = ''
  draft.authorizeUrl = ''
  draft.tokenUrl = ''
  draft.userInfoUrl = ''
  draft.scope = ''
  draft.apiUrl = ''
  draft.type = ''
  draft.fieldMapping = ''
}

function openCreate() {
  resetForm()
  formOpen.value = true
  notice.value = ''
  error.value = ''
}

function openEdit(provider: AdminProvider) {
  resetForm()
  editingId.value = provider.id
  formOpen.value = true
  draft.name = provider.name
  draft.displayName = provider.displayName
  draft.kind = provider.kind
  draft.enabled = provider.enabled
  draft.icon = provider.icon ?? ''
  draft.clientId = provider.clientId ?? ''
  // 密钥不回显：留空表示不改
  draft.clientSecret = ''
  draft.authorizeUrl = provider.authorizeUrl ?? ''
  draft.tokenUrl = provider.tokenUrl ?? ''
  draft.userInfoUrl = provider.userInfoUrl ?? ''
  draft.scope = provider.scope ?? ''
  draft.apiUrl = provider.apiUrl ?? ''
  draft.type = provider.type ?? ''
  draft.fieldMapping = provider.fieldMapping ?? ''
  notice.value = ''
  error.value = ''
}

function closeForm() {
  formOpen.value = false
  resetForm()
}

async function save() {
  busy.value = 'save'
  error.value = ''
  notice.value = ''
  try {
    const payload: AdminProviderInput = {
      name: draft.name.trim(),
      displayName: draft.displayName.trim() || draft.name.trim(),
      kind: draft.kind,
      enabled: draft.enabled,
      icon: draft.icon.trim() || null,
      clientId: draft.clientId.trim() || null,
      // 留空 → 不发送该字段（undefined 会被 JSON.stringify 丢掉），后端据此保留原密钥
      clientSecret: draft.clientSecret ? draft.clientSecret : null,
      authorizeUrl: draft.authorizeUrl.trim() || null,
      tokenUrl: draft.tokenUrl.trim() || null,
      userInfoUrl: draft.userInfoUrl.trim() || null,
      scope: draft.scope.trim() || null,
      apiUrl: draft.apiUrl.trim() || null,
      type: draft.type.trim() || null,
      fieldMapping: draft.fieldMapping.trim() || null,
    }

    if (isEditing.value) {
      await identityAdminApi.updateProvider(editingId.value!, payload)
      notice.value = '已保存'
    } else {
      await identityAdminApi.createProvider(payload)
      notice.value = '已创建'
    }

    closeForm()
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '保存失败'
  } finally {
    busy.value = ''
  }
}

async function toggle(provider: AdminProvider) {
  busy.value = provider.id + ':toggle'
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.setProviderEnabled(provider.id, !provider.enabled)
    notice.value = provider.enabled ? `已停用 ${provider.displayName}` : `已启用 ${provider.displayName}`
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '操作失败'
  } finally {
    busy.value = ''
  }
}

async function remove(provider: AdminProvider) {
  const ok = window.confirm(
    `确定删除「${provider.displayName}」吗？\n\n已有用户绑定该登录方式时无法删除，请改用停用。`,
  )
  if (!ok) return

  busy.value = provider.id + ':delete'
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.deleteProvider(provider.id)
    notice.value = `已删除 ${provider.displayName}`
    if (editingId.value === provider.id) closeForm()
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '删除失败'
  } finally {
    busy.value = ''
  }
}

function kindLabel(kind: string): string {
  return kind === 'rainbow' ? '彩虹聚合' : 'OAuth2'
}
</script>

<template>
  <IdSiteShell>
    <template #nav>
      <button type="button" class="nav-action" @click="router.push('/account')">我的账户</button>
      <button type="button" class="nav-action" @click="router.push('/admin/accounts')">账号管理</button>
      <IdThemeToggle />
    </template>

    <header class="head">
      <div>
        <h1 class="head__title">登录方式</h1>
        <p class="head__sub">共 {{ items.length }} 个 · 停用后登录页不再展示，已绑定用户的绑定记录保留</p>
      </div>
      <IdButton size="sm" @click="openCreate">新建登录方式</IdButton>
    </header>

    <IdAlert v-if="error" variant="error" title="操作未完成">{{ error }}</IdAlert>
    <IdAlert v-if="notice" variant="info">{{ notice }}</IdAlert>

    <!-- 表单 -->
    <IdProviderForm
      v-if="formOpen"
      :draft="draft"
      :editing="isEditing"
      :busy="busy === 'save'"
      @save="save"
      @cancel="closeForm"
    />

    <p v-if="loading" class="loading">加载中…</p>

    <IdAlert v-else-if="!items.length" variant="info" title="还没有任何登录方式">
      新建一个 OAuth2 提供方，或在 <code>Identity:External</code> 种子配置里预置。
    </IdAlert>

    <ul v-else class="list">
      <li v-for="provider in items" :key="provider.id" class="row">
        <div class="row__main">
          <div class="row__title">
            <span class="row__name">{{ provider.displayName }}</span>
            <span class="tag">{{ kindLabel(provider.kind) }}</span>
            <span class="tag" :class="provider.enabled ? 'tag--ok' : 'tag--off'">
              {{ provider.enabled ? '已启用' : '已停用' }}
            </span>
            <span class="tag" :class="provider.hasSecret ? 'tag--ok' : 'tag--warn'">
              {{ provider.hasSecret ? '密钥已配置' : '未配置密钥' }}
            </span>
          </div>
          <p class="row__meta">
            标识 <code>{{ provider.name }}</code> · 已绑定 {{ provider.bindingCount }} 个账号
          </p>
        </div>

        <div class="row__actions">
          <IdButton variant="secondary" size="sm" @click="openEdit(provider)">编辑</IdButton>
          <IdButton
            variant="secondary"
            size="sm"
            :loading="busy === provider.id + ':toggle'"
            @click="toggle(provider)"
          >
            {{ provider.enabled ? '停用' : '启用' }}
          </IdButton>
          <IdButton
            variant="secondary"
            size="sm"
            :disabled="provider.bindingCount > 0"
            :title="provider.bindingCount > 0 ? '已有用户绑定，请改为停用' : '删除'"
            :loading="busy === provider.id + ':delete'"
            @click="remove(provider)"
          >
            删除
          </IdButton>
        </div>
      </li>
    </ul>
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










.loading {
  color: var(--id-text-muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
  list-style: none;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-4);
  padding: var(--id-space-4);
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-card);
}

.row__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--id-space-2);
}

.row__name {
  font-weight: 500;
  color: var(--id-text);
}

.row__meta {
  margin-top: 4px;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.row__meta code {
  font-family: ui-monospace, monospace;
  color: var(--id-text-faint);
}

.row__actions {
  display: flex;
  gap: var(--id-space-2);
}

.tag {
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

.tag--off {
  color: var(--id-text-faint);
}
</style>