<script setup lang="ts">
/**
 * 全局提示条宿主（MD3 Snackbar）。
 *
 * 实现已上移到组件库（`M3SnackbarHost`），消息状态由 `useSnackbar()` 管。
 * 这里保留薄壳只为不动 `App.vue` 的挂载点；**新代码请直接用 `M3SnackbarHost`**
 * 与 `useSnackbar()`。
 */
import { M3SnackbarHost } from '@clderystd/m3-ui'
</script>

<template>
  <M3SnackbarHost />
</template>
