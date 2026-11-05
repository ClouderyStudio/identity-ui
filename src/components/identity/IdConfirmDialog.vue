<script setup lang="ts">
import { ref } from 'vue'
import { M3Button, M3Dialog } from '@cloudery/m3-ui'

/**
 * 确认对话框：**替代 window.confirm**。
 *
 * 后台里「停用账号 / 重置口令 / 解绑 / 删除登录方式」都是不可撤销的操作，
 * 原生 confirm 在 M3 界面里既突兀，也承载不了多段说明（例如「停用后现有会话立刻失效」）。
 *
 * 页面里放一个 `<IdConfirmDialog ref="confirmRef" />`，
 * 然后 `const ok = await confirmRef.value?.ask({ title, body, danger: true })`。
 */
export interface ConfirmOptions {
  title: string
  /** 正文；数组表示多段。 */
  body?: string | string[]
  confirmLabel?: string
  cancelLabel?: string
  /** 破坏性操作：确认按钮换成 error 配色。 */
  danger?: boolean
}

const open = ref(false)
const options = ref<ConfirmOptions>({ title: '' })
let resolver: ((value: boolean) => void) | null = null

function ask(next: ConfirmOptions): Promise<boolean> {
  // 上一个还没关闭就又被调用时，先把前一个判成取消
  resolver?.(false)
  options.value = next
  open.value = true
  return new Promise<boolean>((resolve) => {
    resolver = resolve
  })
}

function settle(value: boolean): void {
  open.value = false
  resolver?.(value)
  resolver = null
}

function paragraphs(): string[] {
  const body = options.value.body
  if (!body) return []
  return Array.isArray(body) ? body : [body]
}

defineExpose({ ask })
</script>

<template>
  <M3Dialog
    :model-value="open"
    :title="options.title"
    @update:model-value="settle(false)"
  >
    <div class="confirm__body">
      <p v-for="(text, index) in paragraphs()" :key="index" class="confirm__text">{{ text }}</p>
    </div>

    <template #actions>
      <M3Button variant="text" @click="settle(false)">{{ options.cancelLabel ?? '取消' }}</M3Button>
      <button
        type="button"
        class="confirm__action"
        :class="{ 'confirm__action--danger': options.danger }"
        @click="settle(true)"
      >
        {{ options.confirmLabel ?? '确定' }}
      </button>
    </template>
  </M3Dialog>
</template>

<style scoped>
.confirm__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirm__text {
  margin: 0;
  white-space: pre-line;
}

/* 自己实现一个按钮，只为在破坏性操作时换成 error 角色（M3Button 的颜色写死在令牌里） */
.confirm__action {
  height: 40px;
  padding-inline: 24px;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-family: inherit;
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  cursor: pointer;
  transition: box-shadow var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.confirm__action--danger {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

@media (hover: hover) {
  .confirm__action:hover {
    box-shadow: var(--md-sys-elevation-level1);
  }
}
</style>
