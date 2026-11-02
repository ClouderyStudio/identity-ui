<script setup lang="ts">
import IdBackground from './IdBackground.vue'
import IdThemeToggle from './IdThemeToggle.vue'

/**
 * 页面外壳：全屏背景 + 左侧卡片 + 右侧留白。
 *
 * 桌面端卡片贴左（参考站就是左侧浮卡、右侧留给插画），四周留白 >= 15%；
 * 窄屏改成居中单列。页脚放法务文案与主题切换。
 */
withDefaults(
  defineProps<{
    image?: string
    /** 页脚法务文案（各应用可替换）。 */
    legal?: string
    /** 是否隐藏主题切换（嵌进宿主应用时可能已有自己的切换）。 */
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
  align-items: center;
  /* 卡片贴左、右侧留给背景：参考站就是这个构图，四周留白仍由 --id-shell-padding 保证 >= 15% */
  padding: var(--id-shell-padding);
  padding-right: max(var(--id-shell-padding), 30%);
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
  padding: 0 var(--id-shell-padding) var(--id-space-5);
  color: var(--id-text-faint);
}

.id-layout__legal {
  font-size: var(--id-font-small);
}

@media (max-width: 720px) {
  .id-layout__main {
    padding: var(--id-space-5);
    padding-right: var(--id-space-5);
    align-items: flex-start;
    padding-top: max(var(--id-space-6), 8vh);
  }

  .id-layout__slot {
    max-width: 100%;
  }

  .id-layout__footer {
    padding: 0 var(--id-space-5) var(--id-space-5);
  }
}
</style>