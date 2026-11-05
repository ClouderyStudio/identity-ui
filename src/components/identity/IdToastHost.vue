<script setup lang="ts">
/**
 * 全局提示条（MD3 Snackbar）。
 *
 * 取代 `window.alert`：一次性、非阻塞、自动消失，可手动关闭。
 * 任何组件通过 `useToast().error(msg)` 调用，由挂在 App 根部的 <IdToastHost /> 统一渲染。
 */
import { IconCheckCircle, IconClose, IconError, IconInfo, IconWarning } from '@/icons'
import { M3Icon, M3IconButton } from '@clderystd/m3-ui'
import { useToast } from '@/composables/useToast'

const { current, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="current"
        class="toast"
        :class="'toast--' + current.tone"
        :role="current.tone === 'error' ? 'alert' : 'status'"
        :aria-live="current.tone === 'error' ? 'assertive' : 'polite'"
      >
        <M3Icon
          :icon="
            current.tone === 'error'
              ? IconError
              : current.tone === 'success'
                ? IconCheckCircle
                : current.tone === 'warning'
                  ? IconWarning
                  : IconInfo
          "
          :size="20"
          class="toast__icon"
        />
        <div class="toast__body">
          <p v-if="current.title" class="toast__title md-typescale-title-small">{{ current.title }}</p>
          <p class="toast__text md-typescale-body-medium">{{ current.text }}</p>
        </div>
        <M3IconButton :icon="IconClose" label="关闭提示" size="sm" @click="dismiss" />
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
export default { name: 'IdToastHost' }
</script>

<style scoped>
.toast {
  position: fixed;
  z-index: 500;
  inset-block-end: 24px;
  inset-inline-start: 50%;
  translate: -50% 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: min(560px, calc(100vw - 32px));
  padding: 12px 8px 12px 16px;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  box-shadow: var(--md-sys-elevation-level3);
}

.toast__icon {
  margin-block-start: 2px;
  flex-shrink: 0;
  color: var(--md-sys-color-inverse-primary);
}

.toast--error .toast__icon {
  color: var(--md-sys-color-error);
}

.toast--warning .toast__icon {
  color: var(--md-sys-color-tertiary);
}

.toast__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast__title,
.toast__text {
  margin: 0;
}

.toast__text {
  word-break: break-word;
}

.toast :deep(.md-icon-btn) {
  color: inherit;
  margin-block-start: -4px;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-emphasized-decelerate),
    translate var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-emphasized-decelerate);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  translate: -50% 20px;
}

/* 窄屏：贴底全宽，避免遮住表单 */
@media (max-width: 600px) {
  .toast {
    inset-block-end: 12px;
    width: calc(100vw - 24px);
  }
}
</style>
