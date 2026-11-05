<script setup lang="ts">
import { computed } from 'vue'
import { IconBrightnessAuto, IconDarkMode, IconLightMode } from '@/icons'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import M3IconButton from '@/components/m3/M3IconButton.vue'
import M3SegmentedButton, { type SegmentedOption } from '@/components/m3/M3SegmentedButton.vue'
import M3Tooltip from '@/components/m3/M3Tooltip.vue'

/**
 * 主题切换：浅色 / 深色 / 跟随系统。
 *
 * 两种形态：
 *   - `compact`（默认）：一个圆形图标按钮，点一次在明暗之间切换，用于页眉 / 页脚这类窄地方；
 *   - `segmented`：MD3 分段按钮三选一，用于设置面板。
 */
const props = withDefaults(
  defineProps<{
    variant?: 'compact' | 'segmented'
    /** 分段按钮是否铺满容器。 */
    block?: boolean
  }>(),
  { variant: 'compact', block: false },
)

const { mode, isDark, setMode, toggle } = useTheme()

const options: SegmentedOption[] = [
  { value: 'light', label: '浅色', icon: IconLightMode },
  { value: 'dark', label: '深色', icon: IconDarkMode },
  { value: 'system', label: '跟随系统', icon: IconBrightnessAuto },
]

const current = computed(() => options.find((option) => option.value === mode.value)?.label ?? '跟随系统')
</script>

<template>
  <M3SegmentedButton
    v-if="props.variant === 'segmented'"
    :options="options"
    :model-value="mode"
    :block="props.block"
    aria-label="主题"
    @update:model-value="(value) => setMode(value as ThemeMode)"
  />

  <M3Tooltip v-else :text="isDark ? '切换到浅色主题' : '切换到深色主题'" placement="bottom">
    <M3IconButton
      :icon="isDark ? IconLightMode : IconDarkMode"
      :label="'主题：' + current + '，点击切换'"
      @click="toggle"
    />
  </M3Tooltip>
</template>
