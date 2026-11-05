<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { IconArrowBack } from '@/icons'
import { M3Button, M3Icon } from '@clderystd/m3-ui'
import IdCard from './IdCard.vue'
import IdLayout from './IdLayout.vue'

/** 法务页面外壳：标题 + 生效日期 + 正文，排版窄栏便于阅读。 */
withDefaults(
  defineProps<{
    title: string
    updated: string
    intro?: string
  }>(),
  { intro: '' },
)
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <RouterLink class="legal__back" to="/login">
          <M3Icon :icon="IconArrowBack" :size="18" />
          返回登录
        </RouterLink>
        <h1 class="legal__title md-typescale-headline-medium">{{ title }}</h1>
        <p class="legal__updated md-typescale-body-small">最后更新：{{ updated }}</p>
      </template>

      <p v-if="intro" class="legal__intro md-typescale-body-large">{{ intro }}</p>

      <div class="legal__body md-typescale-body-medium">
        <slot />
      </div>

      <template #footer>
        <div class="legal__footer">
          <span>如对本文档有疑问，可通过站点公布的联络方式联系我们。</span>
          <M3Button variant="text" size="sm" :href="'/privacy'">隐私政策</M3Button>
        </div>
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.legal__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  margin-block-end: 12px;
  padding: 4px 8px 4px 4px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  text-decoration: none;
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.legal__back:hover {
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-primary);
}

.legal__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.legal__updated {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

/* 法务长文用 680px 的阅读宽度，而不是登录卡片的 480px */
.legal__intro {
  margin: 0 0 20px;
  color: var(--md-sys-color-on-surface-variant);
}

.legal__body {
  color: var(--md-sys-color-on-surface);
  line-height: 1.75;
}

.legal__body :deep(h2) {
  margin: 24px 0 8px;
  color: var(--md-sys-color-primary);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  letter-spacing: var(--md-sys-typescale-title-medium-tracking);
}

.legal__body :deep(h3) {
  margin: 16px 0 6px;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-title-small-size);
  font-weight: var(--md-sys-typescale-title-small-weight);
}

.legal__body :deep(p) {
  margin: 0 0 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.legal__body :deep(ul) {
  margin: 0 0 12px;
  padding-inline-start: 20px;
  list-style: disc;
}

.legal__body :deep(li) {
  margin-block-end: 6px;
  color: var(--md-sys-color-on-surface-variant);
}

.legal__body :deep(li::marker) {
  color: var(--md-sys-color-primary);
}

.legal__body :deep(strong) {
  color: var(--md-sys-color-on-surface);
  font-weight: 600;
}

.legal__body :deep(a) {
  color: var(--md-sys-color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.legal__body :deep(code) {
  padding: 1px 6px;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-highest);
  font-family: var(--md-ref-typeface-mono);
  font-size: 0.92em;
}

.legal__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>
