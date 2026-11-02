<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

// 提前初始化主题，避免首屏闪一下深色
useTheme()
</script>

<template>
  <RouterView />
</template>
