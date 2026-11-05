<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { IconGithub } from '@/icons'
import { M3IconButton, M3TopAppBar } from '@cloudery/m3-ui'
import IdBrand from './identity/IdBrand.vue'
import IdThemeToggle from './identity/IdThemeToggle.vue'

/**
 * 全屏站点外壳（账户面板 / 管理后台）。
 *
 * 与 IdLayout 的分工：
 *   - IdLayout 是「背景插画 + 右侧整屏毛玻璃面板」的登录类页面；
 *   - 这里是占满视口的后台结构：固定顶部应用栏 + 居中宽栏内容 + 页脚法务行。
 *
 * 顶部栏滚动后切成容器色并抬起（M3TopAppBar 的 is-scrolled 表现），与官网页一致。
 */
withDefaults(
  defineProps<{
    brand?: string
    tagline?: string
    legal?: string
    /** 页面主色宽度档位。 */
    width?: 'wide' | 'reading'
    /** 内容区去掉顶部留白（页面自己控制间距时用）。 */
    flush?: boolean
  }>(),
  {
    brand: '云术身份中心',
    tagline: '一处登录，全站通行',
    legal: '云术工作室 · 身份中心',
    width: 'wide',
    flush: false,
  },
)

const scrolled = ref(false)

function onScroll(): void {
  scrolled.value = window.scrollY > 8
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

const year = new Date().getFullYear()
</script>

<template>
  <div class="shell">
    <a class="md-skip-link" href="#id-shell-main">跳到主内容</a>

    <M3TopAppBar :scrolled="scrolled">
      <template #leading>
        <IdBrand :name="brand" :tagline="tagline" href="/account" :size="32" />
      </template>

      <template #actions>
        <nav class="shell__nav" aria-label="站点导航">
          <slot name="nav" />
        </nav>
        <IdThemeToggle />
      </template>
    </M3TopAppBar>

    <main id="id-shell-main" class="shell__main" :class="{ 'shell__main--flush': flush }">
      <div class="id-page" :class="width === 'reading' ? 'id-page--reading' : 'id-page--wide'">
        <slot />
      </div>
    </main>

    <footer class="shell__footer">
      <div class="id-page id-page--wide shell__footer-inner">
        <span class="md-typescale-body-small">© {{ year }} {{ legal }}</span>
        <nav class="shell__footer-links" aria-label="法务">
          <a class="shell__footer-link" href="/terms">服务条款</a>
          <a class="shell__footer-link" href="/privacy">隐私政策</a>
          <M3IconButton
            :icon="IconGithub"
            label="云术工作室 GitHub"
            size="sm"
            href="https://github.com/ClouderyStudio"
            target="_blank"
            rel="noopener noreferrer"
          />
        </nav>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--md-sys-color-surface);
}

/* 顶栏右侧：窄屏下导航必须能收缩，否则会把顶栏撑出视口（整页获得横向滚动） */
.shell__nav {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-inline-end: 4px;
  min-width: 0;
  overflow: hidden;
}

@media (max-width: 720px) {
  /* 窄屏只留图标按钮，文字版导航收进页面里的入口 */
  .shell__nav :deep(.md-btn) {
    display: none;
  }
}

.shell__main {
  flex: 1;
  padding-block: 24px 48px;
}

.shell__main--flush {
  padding-block-start: 8px;
}

.shell__footer {
  border-block-start: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
}

.shell__footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-block: 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.shell__footer-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shell__footer-link {
  padding: 6px 10px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  text-decoration: none;
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.shell__footer-link:hover {
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-primary);
}
</style>
