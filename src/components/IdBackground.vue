<script setup lang="ts">
/**
 * 背景层：**默认不渲染任何东西**。
 *
 * 按需求，页面背景由宿主应用自己提供（插画 / 渐变 / 纯色都行），本库不再接管。
 * 只有显式传入 image 时才铺一层带蒙版的全屏图，供 demo 或独立部署使用。
 */
withDefaults(
  defineProps<{
    /** 插画地址；不传则不渲染背景（默认行为）。 */
    image?: string
    /** 蒙版强度 0–1。 */
    overlay?: number
  }>(),
  { image: '', overlay: 0.55 },
)
</script>

<template>
  <div v-if="image" class="id-background" aria-hidden="true">
    <div class="id-background__image" :style="{ backgroundImage: `url(${image})` }" />
    <div class="id-background__scrim" :style="{ opacity: String(overlay) }" />
  </div>
</template>

<style scoped>
.id-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.id-background__image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.id-background__scrim {
  position: absolute;
  inset: 0;
  background: var(--id-bg-base);
}
</style>
