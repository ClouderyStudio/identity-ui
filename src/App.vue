<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { initTheme } from '@/composables/useTheme'
import { useSession } from '@/composables/useSession'

// 提前初始化主题，避免首屏闪一下深色
initTheme()

// 首屏拉一次登录态，路由守卫据此决定是进登录页还是账户面板
const { refresh } = useSession()
onMounted(refresh)
</script>

<template>
  <RouterView />
</template>
