<script setup lang="ts">
/**
 * 主卡片：Fluent 的 acrylic 材质。
 *
 * 半透明底 + 高斯模糊（--id-blur-card），圆角 8px，一层极淡的 elevation。
 * 背景由宿主提供，卡片靠模糊把背后的内容「磨砂化」，而不是自己画底图。
 */
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** 关闭模糊（降级或嵌在已有材质上）。 */
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
  padding: var(--id-space-6) var(--id-space-6) var(--id-space-5);
  border-radius: var(--id-radius-card);
  background: var(--id-surface);
  border: 1px solid var(--id-border);
  box-shadow:
    var(--id-shadow-card),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  /* 高斯模糊：背后的背景被磨砂化，卡片自身保持半透明 */
  backdrop-filter: blur(var(--id-blur-card)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--id-blur-card)) saturate(180%);
  color: var(--id-text-body);
}

/* 不支持毛玻璃时退回更实的底，避免文字糊在背景上 */
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
  font-family: 'Segoe UI Variable Display', var(--id-font-family);
  font-size: var(--id-font-title);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--id-text);
  line-height: 1.25;
}

.id-card__subtitle {
  margin-top: var(--id-space-1);
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

@media (max-width: 640px) {
  .id-card {
    padding: var(--id-space-5);
  }
}
</style>