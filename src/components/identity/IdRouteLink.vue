<script setup lang="ts">
import { useRouter } from 'vue-router'

/**
 * 站内跳转链接。
 *
 * 为什么不用 <a href> / RouterLink：
 * 只要元素带 `href`，浏览器就会在悬停时把目标地址显示在左下角状态栏。
 * 在这个站里那串地址对用户没有意义（全是 /login、/terms 这类内部路径），
 * 而且浮动的小字会盖住背景图，观感很糟。改用不带 href 的元素 + `router.push`
 * 就没有这行提示——代价是失去浏览器原生的"新标签页打开"，站内跳转不需要它。
 *
 * 用 <a> 但不给 href 仍然保留链接语义（role=link + tabindex + 回车/空格触发），
 * 读屏软件与键盘用户的行为不变。
 */
const props = defineProps<{
  /** 站内路由地址。 */
  to: string
}>()

const router = useRouter()

function go(): void {
  void router.push(props.to)
}

/** 键盘可达：链接元素默认靠回车激活，空格是常见补充。 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    go()
  }
}
</script>

<template>
  <a
    class="route-link"
    role="link"
    tabindex="0"
    @click="go"
    @keydown="onKeydown"
  >
    <slot />
  </a>
</template>

<style scoped>
/* 只有这一条视觉规则：剩下的排版/配色由调用方的 class 决定 */
.route-link {
  cursor: pointer;
}
</style>
