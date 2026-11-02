<script setup lang="ts">
/**
 * 全屏背景层：渐变兜底 + 可选插画。
 *
 * 设计规则（§13.1）：背景固定不随内容滚动；插画上叠一层主题色蒙版，
 * 保证深色主题下卡片边缘仍有足够对比度、浅色主题下文字不糊在亮部。
 */
withDefaults(
  defineProps<{
    /** 插画地址；不传时只用渐变（默认，避免仓库里拖一张大图）。 */
    image?: string
    /** 蒙版强度 0–1，越大越压暗/压亮插画。 */
    overlay?: number
  }>(),
  { image: '', overlay: 0.55 },
)
</script>

<template>
  <div class="id-background" aria-hidden="true">
    <div
      v-if="image"
      class="id-background__image"
      :style="{ backgroundImage: `url(${image})`, opacity: 'var(--id-overlay-image-opacity)' }"
    />
    <div class="id-background__scrim" :style="{ opacity: String(overlay) }" />
    <div class="id-background__glow" />
  </div>
</template>

<style scoped>
.id-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(1200px 800px at 15% 10%, var(--id-bg-gradient-a), transparent 60%),
    radial-gradient(900px 700px at 85% 90%, var(--id-bg-gradient-b), transparent 65%),
    var(--id-bg-base);
}

.id-background__image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* 插画轻微放大并缓慢漂移，让静止的登录页有一点呼吸感 */
  transform: scale(1.06);
}

.id-background__scrim {
  position: absolute;
  inset: 0;
  background: var(--id-bg-base);
  mix-blend-mode: normal;
}

.id-background__glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(60% 50% at 70% 20%, var(--id-accent-soft), transparent 70%);
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .id-background__image {
    animation: id-drift 40s ease-in-out infinite alternate;
  }
}

@keyframes id-drift {
  from {
    transform: scale(1.06) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.12) translate3d(-1.5%, -1%, 0);
  }
}
</style>
