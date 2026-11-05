<script setup lang="ts">
import { computed } from 'vue'
import { IconKey, IconLink, IconSave } from '@/icons'
import { M3Button, M3Divider, M3Icon, M3Switch } from '@clderystd/m3-ui'
import IdField from './IdField.vue'
import IdSelect, { type SelectOption } from './identity/IdSelect.vue'

/**
 * 登录方式编辑表单（自定义 OAuth2 提供方 / 彩虹聚合）。
 *
 * 抽成独立组件有两个理由：
 *   1. 表单字段多，和列表页放一起会让那个页面难以阅读；
 *   2. 密钥**只写不读**这条约定集中在一处表达 —— 输入框永远从空开始，
 *      留空即「保留原值」，由父组件在提交时决定是否发送该字段。
 */
export interface ProviderDraft {
  name: string
  displayName: string
  kind: 'oauth2' | 'rainbow'
  enabled: boolean
  icon: string
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope: string
  apiUrl: string
  type: string
  fieldMapping: string
}

const props = defineProps<{
  draft: ProviderDraft
  editing: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  save: []
  cancel: []
}>()

const kindOptions: SelectOption[] = [
  { value: 'oauth2', label: 'OAuth2（自定义提供方）' },
  { value: 'rainbow', label: '彩虹聚合登录' },
]

const kind = computed({
  get: () => props.draft.kind,
  set: (value: string) => {
    props.draft.kind = value === 'rainbow' ? 'rainbow' : 'oauth2'
  },
})
</script>

<template>
  <section class="panel">
    <header class="panel__header">
      <h2 class="panel__title md-typescale-title-large">
        {{ props.editing ? '编辑登录方式' : '新建登录方式' }}
      </h2>
      <p class="panel__subtitle md-typescale-body-medium">
        密钥只写不读：留空表示保留原有密钥，界面永远不会回显。
      </p>
    </header>

    <div class="grid">
      <IdField
        v-model="props.draft.name"
        label="标识"
        placeholder="例如 github / natayark"
        :disabled="props.editing"
        :hint="props.editing ? '标识一经创建不可修改（它同时是回调地址与绑定记录的键）' : '只能用小写字母、数字与短横线'"
        required
      />
      <IdField v-model="props.draft.displayName" label="显示名称" placeholder="登录按钮上显示的名字" />
      <IdSelect
        v-model="kind"
        label="类型"
        :options="kindOptions"
        :disabled="props.editing"
        :hint="props.editing ? '类型创建后不可修改' : ''"
      />
      <IdField v-model="props.draft.icon" label="图标标识" placeholder="可选，前端按钮用的名字（github / qq …）" />
    </div>

    <M3Divider />

    <!-- OAuth2 专有字段 -->
    <div v-if="props.draft.kind === 'oauth2'" class="grid">
      <IdField v-model="props.draft.clientId" label="Client ID" placeholder="上游平台分配的 client_id" required />
      <IdField
        v-model="props.draft.clientSecret"
        label="Client Secret"
        type="password"
        placeholder="留空表示不修改"
        hint="出于安全考虑，密钥不会回显；留空保存时保留原有密钥"
        revealable
      />
      <IdField v-model="props.draft.authorizeUrl" label="授权地址" placeholder="https://…/authorize" required />
      <IdField v-model="props.draft.tokenUrl" label="令牌地址" placeholder="https://…/token" required />
      <IdField v-model="props.draft.userInfoUrl" label="用户信息地址" placeholder="https://…/userinfo" required />
      <IdField v-model="props.draft.scope" label="Scope" placeholder="例如 openid profile email" hint="留空表示不发送 scope 参数" />
      <IdField
        v-model="props.draft.fieldMapping"
        label="字段映射（JSON）"
        placeholder='{"id":"sub","name":"name","avatar":"picture","email":"email"}'
        hint="必须包含 id：它决定用上游哪个字段当作身份锚点"
      />
    </div>

    <!-- 彩虹聚合专有字段 -->
    <div v-else class="grid">
      <IdField
        v-model="props.draft.apiUrl"
        label="聚合服务地址"
        placeholder="https://u.arsn.cn/"
        hint="两个调用都拼在 connect.php 上"
        required
      />
      <IdField v-model="props.draft.type" label="子平台" placeholder="qq / wx / alipay / github …" required />
      <IdField v-model="props.draft.clientId" label="AppID" placeholder="聚合平台分配的 appid" />
      <IdField
        v-model="props.draft.clientSecret"
        label="AppKey"
        type="password"
        placeholder="留空表示不修改"
        hint="出于安全考虑，密钥不会回显"
        revealable
      />
    </div>

    <div class="switch-row">
      <div class="switch-row__text">
        <p class="switch-row__title md-typescale-title-small">
          <M3Icon :icon="IconLink" :size="18" />
          启用
        </p>
        <p class="switch-row__hint md-typescale-body-small">停用后登录页不再展示该方式，已绑定用户的绑定记录保留。</p>
      </div>
      <M3Switch v-model="props.draft.enabled" label="启用该登录方式" />
    </div>

    <footer class="panel__footer">
      <p class="panel__note md-typescale-body-small">
        <M3Icon :icon="IconKey" :size="16" />
        提交时若密钥为空，只会更新其它字段。
      </p>
      <div class="panel__actions">
        <M3Button variant="text" @click="emit('cancel')">取消</M3Button>
        <M3Button :icon="IconSave" :loading="props.busy" @click="emit('save')">保存</M3Button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-block-end: 20px;
  padding: 20px;
  border-radius: var(--md-sys-shape-corner-large);
  background-color: var(--md-sys-color-surface-container-low);
  box-shadow: var(--md-sys-elevation-level1);
}

.panel__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.panel__subtitle {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface-container);
}

.switch-row__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.switch-row__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.switch-row__hint {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.panel__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel__note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
