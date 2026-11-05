<script setup lang="ts">
import IdBrand from './identity/IdBrand.vue'
import M3TopAppBar from '@/components/m3/M3TopAppBar.vue'

/**
 * 站点页眉：品牌 + 右侧导航。
 *
 * 用 M3TopAppBar 的 overlay 模式：栏体自己不上色，表面由 `background` 插槽绘制，
 * 这样它既能贴在登录页的背景图上，也能在后台页面里保持同一形状。
 */
withDefaults(
  defineProps<{
    brand?: string
    tagline?: string
    /** 关掉毛玻璃表面，用于已经是实色背景的后台页面。 */
    plain?: boolean
  }>(),
  { brand: '云术身份中心', tagline: '一处登录，全站通行', plain: false },
)
</script>

<template>
  <M3TopAppBar overlay :sticky="false">
    <template #background>
      <span class="header__surface" :class="{ 'header__surface--plain': plain }" />
    </template>

    <template #leading>
      <IdBrand :name="brand" :tagline="tagline" href="/login" :size="34" />
    </template>

    <template #actions>
      <nav class="header__nav" aria-label="账户">
        <slot />
      </nav>
    </template>
  </M3TopAppBar>
</template>

<style scoped>
.header__surface {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    180deg,
    color-mix(in srgb, var(--md-sys-color-surface) 60%, transparent),
    transparent
  );
  backdrop-filter: blur(10px) saturate(140%);
  mask-image: linear-gradient(180deg, #000 55%, transparent);
  -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent);
}

.header__surface--plain {
  background-color: var(--md-sys-color-surface-container);
  background-image: none;
  border-block-end: 1px solid var(--md-sys-color-outline-variant);
  backdrop-filter: none;
  mask-image: none;
  -webkit-mask-image: none;
}

.header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>