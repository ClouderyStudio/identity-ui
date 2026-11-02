<script setup lang="ts">
import IdBackground from './IdBackground.vue'
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

    <a class="id-skip-link" href="#id-main">跳到主内容</a>

    <main id="id-main" class="id-layout__main">
      <div class="id-layout__slot">
        <slot />
      </div>
    </main>

    <footer class="id-layout__footer">
      <small class="id-layout__legal">{{ legal }}</small>
      <IdThemeToggle v-if="!hideThemeToggle" />
    </footer>
  </div>
</template>

<style scoped>
.id-layout {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.id-layout__main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  /* 卡片靠右：主轴末端对齐，左侧留白由 padding-left 撑开 */
  justify-content: flex-end;
  align-items: center;
  padding: var(--id-shell-padding);
  padding-left: max(var(--id-shell-padding), 42%);
  /* 顶部留出固定页眉的高度 */
  padding-top: max(var(--id-shell-padding), 72px);
  padding-bottom: var(--id-space-7);
}

.id-layout__slot {
  width: 100%;
  max-width: var(--id-card-width);
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

@media (max-width: 900px) {
  .id-layout__main {
    padding: var(--id-space-5);
    padding-left: var(--id-space-5);
    align-items: flex-start;
    padding-top: max(var(--id-space-6), 10vh);
  }

  .id-layout__slot {
    max-width: 100%;
  }
}
</style>