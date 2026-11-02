<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

// 提前初始化主题，避免首屏闪一下深色
useTheme()
const route = useRoute()

const links = [
  { to: '/login', label: '登录' },
  { to: '/register', label: '注册' },
  { to: '/forgot', label: '找回口令' },
  { to: '/password', label: '改密' },
  { to: '/account', label: '账户面板' },
  { to: '/gallery', label: '组件总览' },
]
</script>

<template>
  <div class="demo">
    <nav class="demo__nav" aria-label="预览导航">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="demo__link"
        :class="{ 'is-active': route.path === link.to }"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
    <main class="demo__view">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.demo {
  min-height: 100vh;
}

.demo__nav {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: var(--id-radius-pill);
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  backdrop-filter: blur(var(--id-blur-card));
  -webkit-backdrop-filter: blur(var(--id-blur-card));
}

.demo__link {
  padding: 5px 12px;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
  border-radius: var(--id-radius-pill);
  transition: background-color var(--id-transition), color var(--id-transition);
}

.demo__link:hover {
  color: var(--id-text);
  background: var(--id-surface-hover);
}

.demo__link.is-active {
  color: var(--id-on-accent);
  background: var(--id-accent);
}

.demo__view {
  position: relative;
}
</style>
