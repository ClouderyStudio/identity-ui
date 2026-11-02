<script setup lang="ts">
import { RouterView } from 'vue-router'
import IdSiteHeader from '@/components/IdSiteHeader.vue'
import { useTheme } from '@/composables/useTheme'

// 提前初始化主题，避免首屏闪一下深色
useTheme()
</script>

<template>
  <div class="site">
    <IdSiteHeader />
    <RouterView />
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
}
</style>
