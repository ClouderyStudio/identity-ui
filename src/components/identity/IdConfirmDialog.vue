<script setup lang="ts">
import { ref } from 'vue'
import { M3ConfirmDialog, type ConfirmOptions } from '@clderystd/m3-ui'

/**
 * 确认对话框：**替代 window.confirm**。
 *
 * 实现已上移到组件库（`M3ConfirmDialog`）——SCForge 的删插件 / 删密钥同样是不可撤销操作。
 * 这里保留薄壳只为不动既有调用点（`ref` + `ask()` 的用法完全一致）；
 * **新代码请直接用 `M3ConfirmDialog`**。
 */
export type { ConfirmOptions }

const inner = ref<InstanceType<typeof M3ConfirmDialog> | null>(null)

/** 与组件库口径一致：返回 true 表示确认。 */
function ask(options: ConfirmOptions): Promise<boolean> {
  return inner.value?.ask(options) ?? Promise.resolve(false)
}

defineExpose({ ask })
</script>

<template>
  <M3ConfirmDialog ref="inner" />
</template>
