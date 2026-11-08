<script setup lang="ts">
import { ref } from 'vue'

import IdPrivacyDialog from './IdPrivacyDialog.vue'
import IdTermsDialog from './IdTermsDialog.vue'

/**
 * 法务链接：外观与 IdRouteLink 一样（无 href 的 <a role="link">），
 * 点击不再跳转到独立页面，而是在原地打开对应文档的对话框。
 *
 * 每个链接自带一份对话框实例（关闭时 v-if 不渲染），
 * 因此 IdLayout / IdSiteShell / 登录页 / 注册页都可以直接用，无需共享全局状态。
 */
const props = defineProps<{
  /** 要打开的文档。 */
  to: 'terms' | 'privacy'
}>()

// 根节点不止一个（链接 + 对话框），class 等属性必须手动落到链接上
defineOptions({ inheritAttrs: false })

const open = ref(false)

function show(): void {
  open.value = true
}

/** 键盘可达：<a> 默认靠回车激活，空格是常见补充。 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    show()
  }
}
</script>

<template>
  <a
    v-bind="$attrs"
    class="legal-link"
    role="link"
    tabindex="0"
    aria-haspopup="dialog"
    @click="show"
    @keydown="onKeydown"
  >
    <slot />
  </a>

  <IdTermsDialog v-if="props.to === 'terms'" v-model="open" />
  <IdPrivacyDialog v-else v-model="open" />
</template>

<style scoped>
.legal-link {
  cursor: pointer;
}
</style>
