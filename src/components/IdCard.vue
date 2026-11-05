<script setup lang="ts">
import { inject } from 'vue'

/**
 * 主卡片：身份页面的内容容器。
 *
 * 两种材质：
 *   - 默认（独立使用时）自己是一张表面：容器色 + 高斯模糊 + 28dp 圆角；
 *   - 在 IdLayout 的右侧面板里（`idSurface: 'panel'`）时**去掉自己的底色与模糊**，
 *     由面板统一承担毛玻璃，避免两层模糊叠成一块灰。
 *
 * 后台页面（IdSiteShell）里用 `density="panel"` 的紧凑内边距。
 */
const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** 强制去掉卡片自身的表面（嵌在面板上时自动生效，这里是显式开关）。 */
    flat?: boolean
    /** 内边距档位：auth 是表单用的舒展版，panel 是后台用的紧凑版。 */
    density?: 'auth' | 'panel'
  }>(),
  { title: '', subtitle: '', flat: false, density: 'auth' },
)

const hostSurface = inject<null | string>('idSurface', null)
const isBare = () => props.flat || hostSurface === 'panel'
</script>

<template>
  <section
    class="id-card"
    :class="['id-card--' + props.density, { 'id-card--bare': isBare() }]"
    :aria-label="props.title || undefined"
  >
    <header v-if="props.title || $slots.header" class="id-card__header">
      <slot name="header">
        <h1 v-if="props.title" class="id-card__title md-typescale-headline-medium">{{ props.title }}</h1>
        <p v-if="props.subtitle" class="id-card__subtitle md-typescale-body-medium">{{ props.subtitle }}</p>
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
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: var(--md-sys-shape-corner-extra-large);
  background-color: var(--id-surface-card);
  color: var(--md-sys-color-on-surface);
  box-shadow:
    var(--md-sys-elevation-level1),
    inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
  backdrop-filter: blur(22px) saturate(150%);
  overflow: hidden;
}

/* 不支持 backdrop-filter 时退回实色，保证文字对比度 */
@supports not (backdrop-filter: blur(1px)) {
  .id-card {
    background-color: var(--id-surface-card-solid);
  }
}

/* 贴在毛玻璃面板上：卡片不再有表面，只剩排版 */
.id-card--bare {
  background-color: transparent;
  backdrop-filter: none;
  box-shadow: none;
  border-radius: 0;
  overflow: visible;
}

.id-card--auth {
  padding: 28px 28px 24px;
}

.id-card--bare.id-card--auth {
  padding: 0;
}

.id-card--panel {
  padding: 20px;
}

.id-card__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 24px;
}

.id-card--panel .id-card__header {
  margin-block-end: 16px;
}

.id-card__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.id-card__subtitle {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.id-card__body {
  display: flex;
  flex-direction: column;
}

.id-card__footer {
  margin-block-start: 24px;
  padding-block-start: 16px;
  border-block-start: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.id-card--panel .id-card__footer {
  margin-block-start: 16px;
  padding-block-start: 12px;
}

@media (max-width: 560px) {
  .id-card--auth {
    padding: 22px 18px 20px;
    border-radius: var(--md-sys-shape-corner-large);
  }

  .id-card--bare.id-card--auth {
    padding: 0;
  }

  .id-card__header {
    margin-block-end: 20px;
  }
}
</style>