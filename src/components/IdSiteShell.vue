<script setup lang="ts">
import IdThemeToggle from './IdThemeToggle.vue'

/**
 * 全屏站点外壳（参考 Natayark Dashboard 的结构）：
 *   固定页眉（品牌 + 导航）/ 居中的内容列 / 页脚法务行。
 *
 * 与 IdLayout 的区别：IdLayout 是「单卡片居中浮在背景上」的登录类页面；
 * 这个外壳用于账户面板等全屏页面，内容列最大宽度 1180px，页面本身占满视口。
 */
withDefaults(
  defineProps<{
    brand?: string
    tagline?: string
    legal?: string
    /** 内容区是否去掉顶部留白（Dashboard 自己控制间距时用）。 */
    flush?: boolean
  }>(),
  {
    brand: '云术身份中心',
    tagline: '一处登录，全站通行',
    legal: '云术工作室 · 身份中心',
    flush: false,
  },
)
</script>

<template>
  <div class="shell">
    <header class="shell__header">
      <div class="shell__header-inner">
        <a class="shell__brand" href="/account">
          <span class="shell__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke-linejoin="round" />
              <path d="M12 12l7-4M12 12v8M12 12L5 8" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="shell__text">
            <span class="shell__name">{{ brand }}</span>
            <span class="shell__tagline">{{ tagline }}</span>
          </span>
        </a>

        <nav class="shell__nav" aria-label="站点导航">
          <slot name="nav" />
        </nav>
      </div>
    </header>

    <main class="shell__main" :class="{ 'shell__main--flush': flush }">
      <slot />
    </main>

    <footer class="shell__footer">
      <div class="shell__footer-inner">
        <span>{{ legal }}</span>
        <IdThemeToggle />
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
}

.shell__header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--id-surface);
  border-bottom: 1px solid var(--id-border);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

.shell__header-inner,
.shell__footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-4);
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--id-space-3) var(--id-space-5);
}

.shell__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--id-space-2);
  color: var(--id-text);
}

.shell__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: var(--id-accent);
  background: var(--id-accent-soft);
  border: 1px solid var(--id-border);
}

.shell__text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.shell__name {
  font-size: var(--id-font-body);
  font-weight: 600;
}

.shell__tagline {
  font-size: 11px;
  color: var(--id-text-faint);
}

.shell__nav {
  display: flex;
  align-items: center;
  gap: var(--id-space-1);
}

.shell__main {
  flex: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--id-space-5);
}

.shell__main--flush {
  padding-top: 0;
}

.shell__footer {
  border-top: 1px solid var(--id-border);
}

.shell__footer-inner {
  padding-top: var(--id-space-3);
  padding-bottom: var(--id-space-3);
  font-size: var(--id-font-small);
  color: var(--id-text-faint);
}

@media (max-width: 720px) {
  .shell__tagline {
    display: none;
  }

  .shell__header-inner,
  .shell__footer-inner,
  .shell__main {
    padding-left: var(--id-space-4);
    padding-right: var(--id-space-4);
  }
}
</style>
