<script setup lang="ts">
import { computed } from 'vue'
import { M3Icon } from '@clderystd/m3-ui'
import { resolveProviderGlyph } from './providerIcons'

/**
 * 第三方登录入口：MD3 outlined 按钮的圆角形态 + 品牌图标。
 *
 * 品牌图标由 providerIcons 统一解析（认不出来用通用链接图标）。
 */
const props = withDefaults(
  defineProps<{
    name: string
    displayName: string
    /** 后端配置的图标标识。 */
    icon?: string | null
    disabled?: boolean
    /** 只显示图标（管理后台里做预览用）。 */
    compact?: boolean
  }>(),
  { icon: null, disabled: false, compact: false },
)

const glyph = computed(() => resolveProviderGlyph(props.icon, props.name))
</script>

<template>
  <button
    type="button"
    class="provider"
    :class="{ 'is-disabled': disabled, 'provider--compact': compact }"
    :disabled="disabled"
    :aria-label="compact ? undefined : '使用 ' + displayName + ' 登录'"
    :aria-hidden="compact ? 'true' : undefined"
    :tabindex="compact ? -1 : undefined"
  >
    <span class="provider__glyph" :class="{ 'provider__glyph--generic': glyph.generic }">
      <M3Icon :icon="glyph.icon" :size="20" />
    </span>
    <span v-if="!compact" class="provider__label md-typescale-label-large">{{ displayName }}</span>
  </button>
</template>

<style scoped>
.provider {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding-inline: 16px;
  overflow: hidden;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: transparent;
  color: var(--md-sys-color-on-surface);
  font-family: inherit;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--md-sys-color-outline);
  transition:
    box-shadow var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.provider::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: currentColor;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

@media (hover: hover) {
  .provider:hover::after {
    opacity: var(--md-sys-state-hover-state-layer-opacity);
  }
}

.provider:focus-visible::after {
  opacity: var(--md-sys-state-focus-state-layer-opacity);
}

.provider__glyph,
.provider__label {
  position: relative;
  z-index: 3;
}

.provider__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
}

.provider__glyph--generic {
  color: var(--md-sys-color-primary);
}

/* ---------- 紧凑态：只有图标，做品牌预览用 ---------- */
.provider--compact {
  width: 44px;
  min-width: 44px;
  min-height: 44px;
  padding-inline: 0;
  justify-content: center;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-variant);
  cursor: default;
  pointer-events: none;
}

.provider--compact .provider__glyph {
  width: 30px;
  height: 30px;
  background-color: transparent;
}

.provider.is-disabled {
  pointer-events: none;
}
</style>
