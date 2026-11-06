<script setup lang="ts">
import { provide } from 'vue'
import { RouterLink } from 'vue-router'
import { IconArrowOutward } from '@/icons'
import { M3Icon } from '@clderystd/m3-ui'
import IdBrand from './identity/IdBrand.vue'
import IdBackground from './IdBackground.vue'
import IdThemeToggle from './identity/IdThemeToggle.vue'

/**
 * 登录类页面外壳（登录 / 注册 / 找回 / 重置 / 改密 / 法务）。
 *
 * 结构：左侧留给背景插画（不铺任何蒙版，照片原样呈现），
 * 右侧是一块**贴满屏幕右半边、高度恰好等于视口**的毛玻璃面板，
 * 面板内部自己滚动，页面本身永不出现滚动条。
 *
 * 面板表面只有高斯模糊 + 一层极轻的表面色，不再叠任何遮罩——
 * 背景图在左侧完全不被压暗。
 */
withDefaults(
  defineProps<{
    /** 背景插画；不需要背景时传空串。 */
    image?: string
    /** 页脚左侧的法务文案。 */
    legal?: string
    /** 隐藏面板右上角的主题切换（嵌在别的站点里时用）。 */
    hideThemeToggle?: boolean
    /** 只留背景与面板，不渲染品牌栏与页脚（极窄的嵌入场景）。 */
    bare?: boolean
  }>(),
  {
    image: '/bg.avif',
    legal: '云术工作室 · 身份中心',
    hideThemeToggle: false,
    bare: false,
  },
)

// 告诉卡片「你已经在面板上了」，IdCard 据此去掉自己的表面与毛玻璃，避免两层材质叠在一起
provide('idSurface', 'panel')

const year = new Date().getFullYear()
</script>

<template>
  <div class="auth">
    <IdBackground :image="image" :particle="128"/>

    <a class="md-skip-link" href="#id-main">跳到主内容</a>

    <main id="id-main" class="auth__panel">
      <div class="auth__panel-inner">
        <header v-if="!bare" class="auth__header">
          <IdBrand href="/login" :size="34" />
          <div class="auth__header-actions">
            <a
              class="auth__site-link md-typescale-label-large"
              href="https://cldery.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              云术工作室
              <M3Icon :icon="IconArrowOutward" :size="15" />
            </a>
            <IdThemeToggle v-if="!hideThemeToggle" />
          </div>
        </header>

        <div class="auth__body">
          <div class="auth__content"><slot /></div>
        </div>

        <footer v-if="!bare" class="auth__footer">
          <p class="auth__legal md-typescale-body-small">© {{ year }} {{ legal }}</p>
          <nav class="auth__links" aria-label="法务">
            <RouterLink class="auth__link" to="/terms">服务条款</RouterLink>
            <RouterLink class="auth__link" to="/privacy">隐私政策</RouterLink>
          </nav>
        </footer>
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  display: flex;
  justify-content: flex-start;
  /* 恰好一屏：面板内部滚动，页面本身不出现滚动条 */
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  isolation: isolate;
}

/* ---------- 左侧面板 ---------- */
.auth__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  /* 贴住屏幕左侧、高度严格等于视口（内容在内部滚动），宽度收到约 1/4 屏 */
  width: clamp(360px, 26vw, 440px);
  height: 100%;
  /* 毛玻璃：模糊 + 一层薄表面色（只为保证文字对比度，背景图本身不被压暗） */
  background-color: var(--id-panel-surface);
  backdrop-filter: blur(30px) saturate(160%);
  border-inline-end: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
  box-shadow: var(--md-sys-elevation-level2);
}

@supports not (backdrop-filter: blur(1px)) {
  .auth__panel {
    background-color: var(--md-sys-color-surface);
  }
}

.auth__panel-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.auth__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 18px 20px 10px;
  flex-shrink: 0;
}

.auth__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.auth__site-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding-inline: 10px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.auth__site-link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  color: var(--md-sys-color-primary);
}

/* 中间区：内容比一屏高时在这里滚动，头尾固定 */
.auth__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  display: flex;
}

.auth__content {
  width: 100%;
  max-width: 100%;
  margin: auto;
  padding: 8px 24px 28px;
}

.auth__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 20px 16px;
  flex-shrink: 0;
  border-block-start: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
  color: var(--md-sys-color-on-surface-variant);
}

.auth__legal {
  margin: 0;
}

.auth__links {
  display: flex;
  align-items: center;
  gap: 2px;
}

.auth__link {
  padding: 4px 8px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
  text-decoration: none;
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.auth__link:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  color: var(--md-sys-color-primary);
}

/* ---------- 窄屏：面板铺满整屏，插画退到后面 ---------- */
@media (max-width: 900px) {
  .auth__panel {
    width: 100%;
    border-inline-end: none;
    /* 窄屏面板铺满整屏，需要更实的表面才读得清 */
    background-color: color-mix(in srgb, var(--md-sys-color-surface) 55%, transparent);
  }

  .auth__header {
    padding: 16px 18px 8px;
  }

  .auth__content {
    max-width: 460px;
    padding: 8px 18px 20px;
  }

  .auth__footer {
    padding: 12px 18px 16px;
  }

  .auth__site-link {
    display: none;
  }
}
</style>