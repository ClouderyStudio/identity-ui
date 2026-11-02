<script setup lang="ts">
import { RouterLink } from 'vue-router'
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
    <article class="legal">
      <header class="legal__header">
        <h1 class="legal__title">{{ title }}</h1>
        <p class="legal__updated">最后更新：{{ updated }}</p>
        <p v-if="intro" class="legal__intro">{{ intro }}</p>
      </header>

      <div class="legal__body">
        <slot />
      </div>

      <footer class="legal__footer">
        <RouterLink to="/login" class="legal__back">返回登录</RouterLink>
      </footer>
    </article>
  </IdLayout>
</template>

<style scoped>
.legal {
  max-width: var(--id-card-width);
}

.legal__title {
  font-size: var(--id-font-title);
  font-weight: 600;
  color: var(--id-text);
}

.legal__updated {
  margin-top: var(--id-space-1);
  font-size: var(--id-font-small);
  color: var(--id-text-faint);
}

.legal__intro {
  margin-top: var(--id-space-4);
  font-size: var(--id-font-body);
  color: var(--id-text-muted);
  line-height: 1.75;
}

.legal__body {
  margin-top: var(--id-space-5);
  font-size: var(--id-font-body);
  color: var(--id-text-body);
  line-height: 1.8;
}

.legal__body :deep(h2) {
  margin: var(--id-space-5) 0 var(--id-space-2);
  font-size: var(--id-font-body);
  font-weight: 600;
  color: var(--id-text);
}

.legal__body :deep(p) {
  margin: 0 0 var(--id-space-3);
}

.legal__body :deep(ul) {
  margin: 0 0 var(--id-space-3);
  padding-left: 1.25em;
}

.legal__body :deep(li) {
  margin-bottom: var(--id-space-1);
}

.legal__body :deep(a) {
  color: var(--id-accent);
}

.legal__footer {
  margin-top: var(--id-space-6);
  padding-top: var(--id-space-4);
  border-top: 1px solid var(--id-border);
}

.legal__back {
  font-size: var(--id-font-small);
  color: var(--id-accent);
}
</style>
