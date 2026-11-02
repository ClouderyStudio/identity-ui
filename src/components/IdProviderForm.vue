<script setup lang="ts">
import IdButton from './IdButton.vue'
import IdField from './IdField.vue'

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
</script>

<template>
  <section class="panel">
    <h2 class="panel__title">{{ props.editing ? '编辑登录方式' : '新建登录方式' }}</h2>

    <div class="form">
      <IdField
        v-model="props.draft.name"
        label="标识"
        placeholder="例如 github / natayark"
        :disabled="props.editing"
        :hint="props.editing ? '标识一经创建不可修改（它同时是回调地址与绑定记录的键）' : '只能用小写字母、数字与短横线'"
        required
      />
      <IdField v-model="props.draft.displayName" label="显示名称" placeholder="登录按钮上显示的名字" />

      <label class="field">
        <span class="field__label">类型</span>
        <select v-model="props.draft.kind" class="select" :disabled="props.editing">
          <option value="oauth2">OAuth2（自定义提供方）</option>
          <option value="rainbow">彩虹聚合登录</option>
        </select>
        <span v-if="props.editing" class="field__hint">类型创建后不可修改</span>
      </label>

      <IdField v-model="props.draft.icon" label="图标标识" placeholder="可选，前端按钮用的名字" />
    </div>

    <!-- OAuth2 专有字段 -->
    <div v-if="props.draft.kind === 'oauth2'" class="form">
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
    <div v-else class="form">
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

    <div class="form form--single">
      <label class="field field--inline">
        <input v-model="props.draft.enabled" type="checkbox" />
        <span>启用（登录页展示该方式）</span>
      </label>
    </div>

    <div class="actions">
      <IdButton :loading="props.busy" @click="emit('save')">保存</IdButton>
      <IdButton variant="secondary" @click="emit('cancel')">取消</IdButton>
    </div>
  </section>
</template>

<style scoped>
.panel {
  margin-bottom: var(--id-space-5);
  padding: var(--id-space-5);
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-card);
}

.panel__title {
  margin-bottom: var(--id-space-4);
  font-size: var(--id-font-body);
  font-weight: 600;
  color: var(--id-text);
}

.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--id-space-4);
}

.form--single {
  margin-top: var(--id-space-4);
  grid-template-columns: 1fr;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: var(--id-font-small);
}

.field--inline {
  flex-direction: row;
  align-items: center;
  gap: var(--id-space-2);
  color: var(--id-text-body);
}

.field__label {
  color: var(--id-text-muted);
}

.field__hint {
  color: var(--id-text-faint);
}

.select {
  height: var(--id-control-height);
  padding: 0 8px;
  font-size: var(--id-font-body);
  color: var(--id-text);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
}

.actions {
  display: flex;
  gap: var(--id-space-2);
  margin-top: var(--id-space-4);
}
</style>
