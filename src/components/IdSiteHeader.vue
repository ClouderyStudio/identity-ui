<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { identityApi } from '@/api/client'

/**
 * 站点页眉：左上角品牌，右上角是「登录 / 账户面板」。
 * 品牌名与副标题可通过 props 覆盖，四个前端接入时直接传自己的名字。
 */
withDefaults(
  defineProps<{
    brand?: string
    tagline?: string
  }>(),
  { brand: '云术身份中心', tagline: '一处登录，全站通行' },
)

const signedIn = ref(false)

onMounted(async () => {
  signedIn.value = (await identityApi.status()) !== null
})

const action = computed(() => (signedIn.value ? { href: '/account', label: '账户面板' } : { href: '/login', label: '登录' }))
</script>

<template>
  <header class="id-header">
    <a class="id-header__brand" href="/login">
      <span class="id-header__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke-linejoin="round" />
          <path d="M12 12l7-4M12 12v8M12 12L5 8" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="id-header__text">
        <span class="id-header__name">{{ brand }}</span>
        <span class="id-header__tagline">{{ tagline }}</span>
      </span>
    </a>

    <nav class="id-header__nav" aria-label="账户">
      <a :href="action.href" class="id-header__link">{{ action.label }}</a>
    </nav>
  </header>
</template>

<style scoped>
.id-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--id-space-4);
  padding: var(--id-space-3) var(--id-space-5);
}

.id-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--id-space-2);
  color: var(--id-text);
}

.id-header__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: var(--id-accent);
  background: var(--id-accent-soft);
  border: 1px solid var(--id-border);
}

.id-header__text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.id-header__name {
  font-size: var(--id-font-body);
  font-weight: 600;
}

.id-header__tagline {
  font-size: 11px;
  color: var(--id-text-faint);
}

.id-header__nav {
  display: flex;
  gap: var(--id-space-2);
}

.id-header__link {
  padding: 5px 12px;
  font-size: var(--id-font-small);
  color: var(--id-text-muted);
  border-radius: 4px;
  transition: background-color var(--id-transition), color var(--id-transition);
}

.id-header__link:hover {
  color: var(--id-text);
  background: var(--id-surface-hover);
}

@media (max-width: 520px) {
  .id-header__tagline {
    display: none;
  }
}
</style>
