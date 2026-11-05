<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconAdd,
  IconCheckCircle,
  IconDelete,
  IconEdit,
  IconKey,
  IconKeyOff,
  IconLink,
  IconLogout,
  IconPerson,
  IconToggleOn,
} from '@/icons'
import M3Button from '@/components/m3/M3Button.vue'
import M3Card from '@/components/m3/M3Card.vue'
import M3Chip from '@/components/m3/M3Chip.vue'
import M3IconButton from '@/components/m3/M3IconButton.vue'
import IdAlert from '@/components/IdAlert.vue'
import IdConfirmDialog, { type ConfirmOptions } from '@/components/identity/IdConfirmDialog.vue'
import IdPageHeader from '@/components/identity/IdPageHeader.vue'
import IdProviderButton from '@/components/identity/IdProviderButton.vue'
import IdProviderForm, { type ProviderDraft } from '@/components/IdProviderForm.vue'
import IdSiteShell from '@/components/IdSiteShell.vue'
import {
  identityAdminApi,
  isApiError,
  type AdminProvider,
  type AdminProviderInput,
} from '@/api/client'
import { useSession } from '@/composables/useSession'

/**
 * 管理员后台 · 登录方式管理（自定义 OAuth2 提供方 + 彩虹聚合）。
 *
 * 安全约定（与后端一致，界面必须配合）：
 *   - 密钥**只写不读**：后端只回 hasSecret，所以编辑框永远是空输入框 + 「已配置/未配置」标签；
 *   - 编辑时密钥留空 = 保留原值，因此界面要明确写出这条，否则管理员会以为留空等于清除。
 */
const router = useRouter()
const session = useSession()

const items = ref<AdminProvider[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const busy = ref('')

/** 正在编辑的行；null 表示表单关闭。id 为空表示「新建」。 */
const editingId = ref<string | null>(null)
const formOpen = ref(false)

const confirmRef = ref<InstanceType<typeof IdConfirmDialog> | null>(null)

async function askConfirm(options: ConfirmOptions): Promise<boolean> {
  return (await confirmRef.value?.ask(options)) ?? false
}

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
      // 留空 → 不发送该字段，后端据此保留原密钥
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
    notice.value = provider.enabled ? '已停用 ' + provider.displayName : '已启用 ' + provider.displayName
    await load()
  } catch (caught) {
    error.value = isApiError(caught) ? caught.detail : '操作失败'
  } finally {
    busy.value = ''
  }
}

async function remove(provider: AdminProvider) {
  const ok = await askConfirm({
    title: '删除「' + provider.displayName + '」？',
    body: '已有用户绑定该登录方式时无法删除，请改用停用。',
    confirmLabel: '删除',
    danger: true,
  })
  if (!ok) return

  busy.value = provider.id + ':delete'
  error.value = ''
  notice.value = ''
  try {
    await identityAdminApi.deleteProvider(provider.id)
    notice.value = '已删除 ' + provider.displayName
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
      <M3Button variant="text" size="sm" :icon="IconLink" @click="router.push('/admin/accounts')">
        账号管理
      </M3Button>
      <M3IconButton :icon="IconLogout" label="退出登录" @click="logout" />
    </template>

    <IdPageHeader
      title="登录方式"
      eyebrow="管理后台"
      :icon="IconLink"
      :description="'共 ' + items.length + ' 个 · 停用后登录页不再展示，已绑定用户的绑定记录保留'"
    >
      <template #actions>
        <M3Button :icon="IconAdd" @click="openCreate">新建登录方式</M3Button>
      </template>
    </IdPageHeader>

    <div class="alerts">
      <IdAlert v-if="error" variant="error" title="操作未完成" dismissible @dismiss="error = ''">
        {{ error }}
      </IdAlert>
      <IdAlert v-if="notice" variant="success" dismissible @dismiss="notice = ''">{{ notice }}</IdAlert>
    </div>

    <IdProviderForm
      v-if="formOpen"
      :draft="draft"
      :editing="isEditing"
      :busy="busy === 'save'"
      @save="save"
      @cancel="closeForm"
    />

    <p v-if="loading" class="loading md-typescale-body-medium">加载中…</p>

    <IdAlert v-else-if="!items.length" variant="info" title="还没有任何登录方式">
      新建一个 OAuth2 提供方，或在 <code>Identity:External</code> 种子配置里预置。
    </IdAlert>

    <ul v-else class="list">
      <li v-for="provider in items" :key="provider.id">
        <M3Card variant="filled" shape="large" class="row">
          <div class="row__main">
            <IdProviderButton
              compact
              :name="provider.name"
              :display-name="provider.displayName"
              :icon="provider.icon"
            />

            <div class="row__text">
              <div class="row__tags">
                <M3Chip
                  variant="assist"
                  :icon="provider.enabled ? IconCheckCircle : IconToggleOn"
                  :label="provider.enabled ? '已启用' : '已停用'"
                />
                <M3Chip variant="assist" :icon="IconLink" :label="kindLabel(provider.kind)" />
                <M3Chip
                  variant="assist"
                  :icon="provider.hasSecret ? IconKey : IconKeyOff"
                  :label="provider.hasSecret ? '密钥已配置' : '未配置密钥'"
                />
              </div>
              <p class="row__meta md-typescale-body-small">
                标识 <code>{{ provider.name }}</code> · 已绑定 {{ provider.bindingCount }} 个账号
              </p>
            </div>
          </div>

          <div class="row__actions">
            <M3Button variant="tonal" size="sm" :icon="IconEdit" @click="openEdit(provider)">编辑</M3Button>
            <M3Button
              variant="outlined"
              size="sm"
              :loading="busy === provider.id + ':toggle'"
              @click="toggle(provider)"
            >
              {{ provider.enabled ? '停用' : '启用' }}
            </M3Button>
            <M3Button
              variant="text"
              size="sm"
              :icon="IconDelete"
              :disabled="provider.bindingCount > 0"
              :title="provider.bindingCount > 0 ? '已有用户绑定，请改为停用' : '删除'"
              :loading="busy === provider.id + ':delete'"
              @click="remove(provider)"
            >
              删除
            </M3Button>
          </div>
        </M3Card>
      </li>
    </ul>

    <IdConfirmDialog ref="confirmRef" />
  </IdSiteShell>
</template>

<style scoped>
.alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-block-end: 16px;
}

.loading {
  color: var(--md-sys-color-on-surface-variant);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row :deep(.md-card__content) {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.row__main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.row__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.row__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.row__meta {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.row__meta code {
  padding: 1px 6px;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-highest);
  font-family: var(--md-ref-typeface-mono);
}

.row__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
