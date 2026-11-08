<script setup lang="ts">
import { M3Button, M3Dialog } from '@clderystd/m3-ui'

/**
 * 法务文档对话框外壳：标题 + 生效日期 + 导语 + 正文。
 *
 * 条款与隐私政策共用这一层。文档比一屏高时在对话框正文区内部滚动，
 * 标题与底部「关闭」始终可见——不把长文塞进会溢出的面板里。
 * 排版沿用原来法务页的窄栏阅读规格（行高、标题色、列表缩进）。
 */
withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    updated: string
    intro?: string
  }>(),
  { intro: '' },
)

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

function close(): void {
  emit('update:modelValue', false)
}
</script>

<template>
  <M3Dialog
    :model-value="modelValue"
    :title="title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="legal">
      <p class="legal__updated md-typescale-body-small">最后更新：{{ updated }}</p>
      <p v-if="intro" class="legal__intro md-typescale-body-large">{{ intro }}</p>

      <div class="legal__body md-typescale-body-medium">
        <slot />
      </div>
    </div>

    <template #actions>
      <M3Button variant="text" @click="close">关闭</M3Button>
    </template>
  </M3Dialog>
</template>

<style scoped>
.legal {
  line-height: 1.75;
}

.legal__updated {
  margin: 0 0 4px;
  color: var(--md-sys-color-on-surface-variant);
}

.legal__intro {
  margin: 0 0 20px;
  color: var(--md-sys-color-on-surface-variant);
}

.legal__body {
  color: var(--md-sys-color-on-surface);
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
</style>
