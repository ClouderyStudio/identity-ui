<script setup lang="ts">
import IdBackground from './IdBackground.vue'
import IdSiteHeader from './IdSiteHeader.vue'
import IdThemeToggle from './IdThemeToggle.vue'

/**
 * 页面外壳：内容卡片靠右，左侧留白交给宿主背景。
 *
 * 桌面端卡片贴右（参考站就是一侧浮卡、另一侧留给背景），留白 >= 15%；
 * 窄屏回到单列居中。背景默认不画，由宿主页面自己提供。
 */
withDefaults(
  defineProps<{
    /** 需要本库铺背景时才传（默认不画）。 */
    image?: string
    legal?: string
    hideThemeToggle?: boolean
  }>(),
  {
    image: '',
    legal: '云术工作室 · 身份中心',
    hideThemeToggle: false,
  },
)
</script>

<template>
  <div class="id-layout">
    <IdBackground :image="image" />

    <IdSiteHeader />
    <div class="id-layout__rule" aria-hidden="true" />

    <a class="id-skip-link" href="#id-main">跳到主内容</a>

    <main id="id-main" class="id-layout__main">
      <div class="id-layout__slot">
        <slot />
      </div>
    </main>

    <footer class="id-layout__footer">
      <small class="id-layout__legal">{{ legal }}</small>
      <div class="id-layout__footer-actions">
        <a href="/terms" class="id-layout__link">服务条款</a>
        <a href="/privacy" class="id-layout__link">隐私政策</a>
        <IdThemeToggle v-if="!hideThemeToggle" />
      </div>
    </footer>
  </div>
</template>

<style scoped>
.id-layout {
  position: relative;
  /* 占满视口但不允许整页滚动：卡片过高时改为卡片内部滚动（见 .id-layout__slot） */
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.id-layout__rule {
  position: relative;
  z-index: 1;
  height: 1px;
  margin: 0 var(--id-space-5);
  background: var(--id-border);
}

.id-layout__main {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  /* 卡片靠右：主轴末端对齐，左侧留白由 padding-left 撑开 */
  justify-content: flex-end;
  align-items: center;
  padding: var(--id-space-5) var(--id-shell-padding);
  padding-left: max(var(--id-shell-padding), 38%);
  overflow: hidden;
}

.id-layout__slot {
  width: 100%;
  max-width: var(--id-card-width);
  /* 卡片比视口还高时在内部滚动，而不是把整页撑出滚动条 */
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.id-layout__footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-4);
  padding: 0 var(--id-shell-padding) var(--id-space-4);
  color: var(--id-text-faint);
}

.id-layout__legal {
  font-size: var(--id-font-small);
}

.id-layout__footer-actions {
  display: flex;
  align-items: center;
  gap: var(--id-space-3);
}

.id-layout__link {
  font-size: var(--id-font-small);
  color: var(--id-text-faint);
}

.id-layout__link:hover {
  color: var(--id-text);
}

@media (max-width: 900px) {
  .id-layout__main {
    padding: var(--id-space-4);
    align-items: flex-start;
  }

  .id-layout__slot {
    max-width: 100%;
  }
}
</style>