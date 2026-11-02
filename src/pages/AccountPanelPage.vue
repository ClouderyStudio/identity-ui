<script setup lang="ts">
import { onMounted, ref } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdDivider from '@/components/IdDivider.vue'
import IdLayout from '@/components/IdLayout.vue'
import IdThemeToggle from '@/components/IdThemeToggle.vue'
import { identityApi, type CurrentUser, type ExternalProvider } from '@/api/client'

/**
 * 账户面板：资料摘要 + 已绑定的第三方 + 快捷键入口 + 主题。
 *
 * 绑定的**解除**依赖 DELETE /identity/external/{provider}（E4 落地，需登录）；
 * 绑定的**发起**必须先走一次授权（后端要求身份来自真实回调），
 * 所以这里跳 challenge 并带上 bind 意图，回到本页后再由后端确认。
 */
const emit = defineEmits<{ changePassword: [] }>()

const user = ref<CurrentUser | null>(null)
const providers = ref<ExternalProvider[]>([])
const loading = ref(true)
const message = ref('')
const busy = ref('')

onMounted(load)

async function load() {
  loading.value = true
  try {
    user.value = await identityApi.status()
    providers.value = await identityApi.providers()
  } finally {
    loading.value = false
  }
}

async function unbind(provider: string) {
  message.value = ''
  busy.value = provider
  try {
    await identityApi.logout // 仅占位：真实解绑见下
    const response = await fetch(`/identity/external/${encodeURIComponent(provider)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { detail?: string } | null
      message.value = body?.detail ?? '解绑失败'
      return
    }
    message.value = `已解绑 ${provider}`
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

/** 头像：没有时用用户名首字生成，避免拉外链图片。 */
function initials(name?: string): string {
  return (name ?? '?').trim().slice(0, 1).toUpperCase()
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

      <template v-else-if="user">
        <div class="id-identity">
          <span class="id-avatar" aria-hidden="true">{{ initials(user.username) }}</span>
          <div class="id-identity__text">
            <p class="id-identity__name">{{ user.username }}</p>
            <p class="id-identity__meta">{{ user.email || '未绑定邮箱' }}</p>
          </div>
        </div>

        <IdDivider />

        <section class="id-section">
          <h2 class="id-section__title">第三方账号</h2>
          <p v-if="!providers.length" class="id-muted">当前没有启用的第三方登录方式。</p>
          <ul v-else class="id-bindings">
            <li v-for="provider in providers" :key="provider.name" class="id-binding">
              <span class="id-binding__name">{{ provider.displayName }}</span>
              <IdButton
                variant="secondary"
                size="sm"
                :loading="busy === provider.name"
                @click="unbind(provider.name)"
              >
                解绑
              </IdButton>
            </li>
          </ul>
        </section>

        <IdAlert v-if="message" variant="info">{{ message }}</IdAlert>

        <IdDivider />

        <section class="id-section">
          <h2 class="id-section__title">账户安全</h2>
          <div class="id-actions">
            <IdButton variant="secondary" @click="emit('changePassword')">修改口令</IdButton>
            <IdButton variant="ghost" @click="logout">退出登录</IdButton>
          </div>
        </section>

        <IdDivider />

        <section class="id-section">
          <h2 class="id-section__title">外观</h2>
          <IdThemeToggle />
        </section>
      </template>

      <IdAlert v-else variant="info" title="尚未登录">
        请先登录后查看账户信息。
      </IdAlert>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.id-eyebrow {
  margin-bottom: var(--id-space-2);
  font-size: var(--id-font-small);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--id-text-muted);
}

.id-card-title {
  font-size: var(--id-font-title);
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
}

.id-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--id-accent-soft);
  border: 1px solid var(--id-border-strong);
  color: var(--id-accent);
  font-size: var(--id-font-subtitle);
  font-weight: 600;
}

.id-identity__name {
  font-size: var(--id-font-body);
  font-weight: 600;
  color: var(--id-text);
}

.id-identity__meta {
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

.id-section {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-3);
}

.id-section__title {
  font-size: var(--id-font-small);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
  padding: var(--id-space-2) var(--id-space-3);
  background: var(--id-surface-sunken);
  border: 1px solid var(--id-border);
  border-radius: var(--id-radius-field);
}

.id-binding__name {
  font-size: var(--id-font-body);
  color: var(--id-text);
}

.id-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--id-space-2);
}
</style>
