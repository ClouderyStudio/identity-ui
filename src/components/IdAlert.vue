<script setup lang="ts">
import { M3Alert } from '@clderystd/m3-ui'

/**
 * 行内提示：error / success / info / warning。
 *
 * 实现已上移到组件库（`M3Alert`）——SCForge 的后台表单、上传页也需要同一套语义色。
 * 这里保留薄壳只为不动 31 处既有调用点；**新代码请直接用 `M3Alert`**。
 */
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    variant?: 'error' | 'success' | 'info' | 'warning'
    title?: string
    dismissible?: boolean
  }>(),
  { variant: 'info', title: '', dismissible: false },
)

const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <M3Alert
    v-bind="$attrs"
    :variant="variant"
    :title="title"
    :dismissible="dismissible"
    @dismiss="emit('dismiss')"
  >
    <slot />
  </M3Alert>
</template>
