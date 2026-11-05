<script setup lang="ts">
import { computed } from 'vue'
import type { IconComponent } from '@/icons'
import { M3Button } from '@cloudery/m3-ui'

/**
 * 身份中心的按钮入口：直接复用官网页的 M3Button。
 *
 * M3Button 已经有 MD3 的四种强调级、状态层、涟漪与加载态；
 * 这里只做两件事：把旧调用点的 primary / secondary / ghost 别名映射到 MD3 口径，
 * 并让 `block` 默认铺满表单宽度。
 */
const props = withDefaults(
  defineProps<{
    /** MD3 强调级；也接受 primary / secondary / ghost 这三个旧别名。 */
    variant?: 'filled' | 'tonal' | 'elevated' | 'outlined' | 'text' | 'primary' | 'secondary' | 'ghost'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    /** 加载态：禁用交互并显示转圈，按钮宽度不变。 */
    loading?: boolean
    /** 占满整行。 */
    block?: boolean
    size?: 'sm' | 'md' | 'lg'
    icon?: IconComponent | null
    trailingIcon?: IconComponent | null
  }>(),
  {
    variant: 'filled',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
    size: 'md',
    icon: null,
    trailingIcon: null,
  },
)

const resolvedVariant = computed<'filled' | 'tonal' | 'elevated' | 'outlined' | 'text'>(() => {
  switch (props.variant) {
    case 'primary':
      return 'filled'
    case 'secondary':
      return 'outlined'
    case 'ghost':
      return 'text'
    default:
      return props.variant
  }
})
</script>

<template>
  <M3Button
    :variant="resolvedVariant"
    :type="props.type"
    :size="props.size"
    :block="props.block"
    :disabled="props.disabled"
    :loading="props.loading"
    :icon="props.icon"
    :trailing-icon="props.trailingIcon"
  >
    <slot />
  </M3Button>
</template>
