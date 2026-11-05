<script setup lang="ts">
import ParticlesBackground from './identity/ParticlesBackground.vue'

/**
 * 背景层：插画原样铺满整个视口，不叠任何蒙版。
 *
 * 左侧那块面板自己用高斯模糊处理需要遮挡的部分，
 * 所以这里只画照片（外加一层极淡的粒子），不再压暗、不再加暗角——
 * 背景照什么就是什么。
 *
 * 窄屏（面板铺满整屏）时照片退到最底层，透过面板仍然可见。
 */
withDefaults(
  defineProps<{
    /** 插画地址；空串表示不铺图。 */
    image?: string
    /** 粒子数量；0 表示关闭。 */
    particles?: number
  }>(),
  { image: '/bg.avif', particles: 70 },
)
</script>

<template>
  <div class="id-background" aria-hidden="true">
    <div
      v-if="image"
      class="id-background__image"
      :style="{ backgroundImage: 'url(' + image + ')' }"
    />
    <div v-if="particles > 0 && image" class="id-background__particles">
      <ParticlesBackground
        :quantity="particles"
        :staticity="120"
        :ease="170"
        color="#ffffff"
      />
    </div>
  </div>
</template>

<style scoped>
.id-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  /* 没有图片时的兜底：主色系里最暗的一档，纯色也不刺眼 */
  background-color: var(--md-sys-color-surface-container-lowest);
}

.id-background__image {
  position: absolute;
  inset: 0;
  background-size: cover;
  /* 面板压在左侧，把画面重心留在右半边 */
  background-position: 62% center;
  background-repeat: no-repeat;
}

@keyframes id-bg-breathe {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
  }
}

/* 粒子用白色：照片上是暗部居多，白点在任何主题下都读得出来 */
.id-background__particles {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  mix-blend-mode: soft-light;
}

@media (prefers-reduced-motion: reduce) {
  /* 只停掉那个无限循环的缓慢缩放，照片与粒子保持原样 */
  .id-background__image {
    animation: none;
  }
}

@media (max-width: 900px) {
  .id-background__image {
    background-position: center;
  }
}
</style>