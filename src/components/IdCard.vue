<script setup lang="ts">
/**
 * 毛玻璃卡片：登录 / 注册 / 账户面板的唯一容器。
 * 半透明底 + backdrop-filter + 1px 内描边 + 24px 圆角（§13.1 的三条规则之一）。
 */
withDefaults(
  defineProps<{
    /** 卡片标题（可选，标题语义由使用方决定层级）。 */
    title?: string
    /** 副标题 / 说明文字。 */
    subtitle?: string
    /** 关闭毛玻璃（低端设备或不支持 backdrop-filter 时的降级由 CSS 自动处理）。 */
    flat?: boolean
  }>(),
  { title: '', subtitle: '', flat: false },
)
</script>

<template>
  <section class="id-card" :class="{ 'id-card--flat': flat }" :aria-label="title || undefined">
    <header v-if="title || $slots.header" class="id-card__header">
      <slot name="header">
        <h1 class="id-card__title">{{ title }}</h1>
        <p v-if="subtitle" class="id-card__subtitle">{{ subtitle }}</p>
      </slot>
    </header>

    <div class="id-card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="id-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.id-card {
  position: relative;
  width: 100%;
  max-width: var(--id-card-width);
  padding: var(--id-space-6);
  border-radius: var(--id-radius-card);
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  box-shadow: var(--id-shadow-card);
  backdrop-filter: blur(var(--id-blur-card)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--id-blur-card)) saturate(140%);
  color: var(--id-text-body);
}

/* 不支持毛玻璃时退回不透明底，避免文字糊在背景上 */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .id-card {
    background: var(--id-surface-strong);
  }
}

.id-card--flat {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: var(--id-surface-strong);
}

.id-card__header {
  margin-bottom: var(--id-space-5);
}

.id-card__title {
  font-size: var(--id-font-title);
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--id-text);
  line-height: 1.3;
}

.id-card__subtitle {
  margin-top: var(--id-space-2);
  font-size: var(--id-font-body);
  color: var(--id-text-muted);
}

.id-card__footer {
  margin-top: var(--id-space-5);
  padding-top: var(--id-space-4);
  border-top: 1px solid var(--id-border);
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
}

@media (max-width: 520px) {
  .id-card {
    padding: var(--id-space-5);
    border-radius: 20px;
  }
}
</style>
