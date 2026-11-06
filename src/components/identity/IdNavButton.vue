<script setup lang="ts">
import { useRouter } from 'vue-router'
import { M3Button } from '@clderystd/m3-ui'

/**
 * 站内跳转按钮。
 *
 * M3Button 的 `href` 渲染的是原生 <a>：浏览器会整页刷新（SPA 里等于丢掉内存态、
 * 白屏闪一下），而且悬停时左下角会浮出目标地址。这里不给 href，改用 @click +
 * router.push —— 外观与交互不变，跳转走前端路由，也不再出现那行地址提示。
 */
const props = defineProps<{
  /** 站内路由地址。 */
  to: string
}>()

// 透传的属性（variant / size / icon / block …）交给 M3Button 自己解析
defineOptions({ inheritAttrs: false })

const router = useRouter()

function go(): void {
  void router.push(props.to)
}
</script>

<template>
  <M3Button v-bind="$attrs" type="button" @click="go">
    <slot />
  </M3Button>
</template>