<script setup lang="ts">
import type { IconComponent } from '@/icons'
import M3Icon from '@/components/m3/M3Icon.vue'

/**
 * 页面标题区（后台 / 账户面板用）。
 *
 * MD3 的「大标题」不是顶栏的一部分，而是内容区的第一块：
 * 小号眉标 + headline + 支持文案，右侧留一个操作槽。
 */
withDefaults(
  defineProps<{
    title: string
    /** 标题下面的说明文字。 */
    description?: string
    /** 标题上方的小标签（例如「账户中心」）。 */
    eyebrow?: string
    /** 标题左侧的强调图标。 */
    icon?: IconComponent | null
    /** 标题排成一行还是两行。 */
    size?: 'medium' | 'large'
  }>(),
  { description: '', eyebrow: '', icon: null, size: 'medium' },
)
</script>

<template>
  <header class="page-header" :class="'page-header--' + size">
    <div class="page-header__text">
      <p v-if="eyebrow" class="page-header__eyebrow md-typescale-label-medium">{{ eyebrow }}</p>
      <h1 class="page-header__title md-typescale-headline-medium">
        <M3Icon v-if="icon" :icon="icon" :size="size === 'large' ? 32 : 28" class="page-header__icon" />
        <span>{{ title }}</span>
      </h1>
      <p v-if="description" class="page-header__description md-typescale-body-medium">{{ description }}</p>
      <slot name="meta" />
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-block-end: 24px;
}

.page-header__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.page-header__eyebrow {
  margin: 0;
  color: var(--md-sys-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.page-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.page-header--large .page-header__title {
  font-size: var(--md-sys-typescale-headline-large-size);
  line-height: var(--md-sys-typescale-headline-large-line-height);
}

.page-header__icon {
  color: var(--md-sys-color-primary);
}

.page-header__description {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 72ch;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

@media (max-width: 720px) {
  .page-header {
    margin-block-end: 16px;
  }
}
</style>
