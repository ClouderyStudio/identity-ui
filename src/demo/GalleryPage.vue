<script setup lang="ts">
import { reactive } from 'vue'
import IdAlert from '@/components/IdAlert.vue'
import IdButton from '@/components/IdButton.vue'
import IdCard from '@/components/IdCard.vue'
import IdDivider from '@/components/IdDivider.vue'
import IdField from '@/components/IdField.vue'
import IdLayout from '@/components/IdLayout.vue'

/**
 * 组件总览：每个组件把「默认 / hover / focus / disabled / error」五种状态并排摆开，
 * 明暗两个主题切一下就能逐项比对（§13.3 F0 的出口条件）。
 * hover / focus 需要真人操作——页面上有提示，别把它当成静态截图验收。
 */
const basic = reactive({ value: 'hello@example.com' })
const invalid = reactive({ value: 'not-an-email' })
const disabled = reactive({ value: '不可编辑' })
const pwd = reactive({ value: 'secret-value' })
</script>

<template>
  <IdLayout>
    <IdCard title="组件总览" subtitle="逐个组件核对五种状态；hover 与 focus 请用鼠标 / Tab 实际触发">
      <section class="gal-section">
        <h2 class="gal-title">IdButton</h2>
        <div class="gal-row">
          <IdButton>主要</IdButton>
          <IdButton variant="secondary">次要</IdButton>
          <IdButton variant="ghost">文字按钮</IdButton>
          <IdButton disabled>已禁用</IdButton>
          <IdButton loading>加载中</IdButton>
          <IdButton size="sm">小尺寸</IdButton>
        </div>
      </section>

      <IdDivider />

      <section class="gal-section">
        <h2 class="gal-title">IdField</h2>
        <div class="gal-grid">
          <IdField v-model="basic.value" label="默认态" placeholder="placeholder" hint="这是一条提示" />
          <IdField v-model="pwd.value" label="密码 + 可见切换" type="password" revealable />
          <IdField v-model="basic.value" label="带后置按钮" action-text="发送验证码" />
          <IdField v-model="invalid.value" label="错误态" error="请输入有效的邮箱地址" />
          <IdField v-model="disabled.value" label="禁用态" disabled />
          <IdField v-model="basic.value" label="必填" required />
        </div>
      </section>

      <IdDivider />

      <section class="gal-section">
        <h2 class="gal-title">IdAlert</h2>
        <div class="gal-stack">
          <IdAlert variant="info" title="信息">普通提示，用于说明性文案。</IdAlert>
          <IdAlert variant="success" title="成功">操作已生效。</IdAlert>
          <IdAlert variant="warning" title="注意">这条操作不可撤销。</IdAlert>
          <IdAlert variant="error" title="出错了">用户名或密码错误。</IdAlert>
        </div>
      </section>

      <IdDivider />

      <section class="gal-section">
        <h2 class="gal-title">IdDivider</h2>
        <div class="gal-stack">
          <IdDivider label="或使用第三方账号" />
          <IdDivider />
        </div>
      </section>

      <template #footer>
        主题切换在右下角；同一套组件在深浅两个主题下都不应出现对比度不足。
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.gal-section {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-3);
}

.gal-title {
  font-size: var(--id-font-small);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--id-text-muted);
}

.gal-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--id-space-2);
  align-items: center;
}

.gal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--id-space-4);
}

.gal-stack {
  display: flex;
  flex-direction: column;
  gap: var(--id-space-2);
}
</style>