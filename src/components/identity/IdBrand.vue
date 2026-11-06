<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
/**
 * 品牌标识：图形标 + 站名 + 副标题。
 *
 * 与官网页页眉同一套视觉（圆角方块里放几何标记 + 双行文字），
 * 这里抽成独立组件，登录卡片、站点头部、页脚都复用它。
 */
const props = withDefaults(
  defineProps<{
    /** 站名。 */
    name?: string
    /** 副标题；窄屏可以传空串隐藏。 */
    tagline?: string
    /** 图形标尺寸（px）。 */
    size?: number
    /** 纵向堆叠（登录卡片里用），默认横排。 */
    stacked?: boolean
    /**
     * 站内路由地址：走前端路由（不整页刷新），且不产生 href，
     * 所以悬停时浏览器左下角不会浮出地址。与 href 二选一，站内一律用它。
     */
    to?: string
    /** 站外绝对地址：用 <a> 渲染。两者都不传则渲染为静态元素。 */
    href?: string
  }>(),
  {
    name: '云术身份中心',
    tagline: '一处登录，全站通行',
    size: 36,
    stacked: false,
    to: undefined,
    href: undefined,
  },
)

const router = useRouter()

const tag = computed(() => {
  // 站内：用不带 href 的 <a>，靠 role=link + 键盘/点击处理跳转
  if (props.to) return 'a'
  return props.href ? 'a' : 'div'
})

const interactive = computed(() => Boolean(props.to || props.href))

function go(): void {
  if (props.to) void router.push(props.to)
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.to) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    go()
  }
}
</script>

<template>
  <component
    :is="tag"
    class="brand"
    :class="{ 'brand--stacked': stacked }"
    :href="href"
    :role="to ? 'link' : undefined"
    :tabindex="to ? 0 : undefined"
    :aria-label="interactive ? name + ' 首页' : undefined"
    @click="go"
    @keydown="onKeydown"
  >
    <span
      class="brand__mark"
      :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.5 + 'px' }"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.8 20 7.3v9.4L12 21.2 4 16.7V7.3z" />
        <path d="M12 12l8-4.7M12 12v9.2M12 12 4 7.3" />
      </svg>
    </span>

    <span class="brand__text">
      <span class="brand__name md-typescale-title-medium">{{ name }}</span>
      <span v-if="tagline" class="brand__tagline md-typescale-body-small">{{ tagline }}</span>
    </span>
  </component>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--md-sys-color-on-surface);
  text-decoration: none;
}

.brand--stacked {
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
  transition:
    transform var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-emphasized),
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.brand:hover .brand__mark {
  transform: rotate(-6deg) scale(1.04);
}

.brand__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.brand--stacked .brand__text {
  align-items: center;
}

.brand__name {
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
}

.brand__tagline {
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}

@media (max-width: 520px) {
  .brand__tagline {
    display: none;
  }
}
</style>