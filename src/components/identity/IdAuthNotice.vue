<script setup lang="ts">
import { ref, useTemplateRef, watchEffect } from 'vue'
import { IconClose, IconExpandMore, IconMail } from '@/icons'
import { M3Icon } from '@clderystd/m3-ui'

/**
 * 身份验证方式变更公告。
 *
 * 背景：原先基于 Casdoor 的第三方登录已弃用，登录链路换成自建身份中心。
 * 少数用户（当年只用第三方登录、从没设过本站密码）因此暂时进不来，
 * 需要人工协助——这类人不会有别的办法联系到我们，所以公告必须出现在
 * 登录 / 注册 / 账户这几个他们一定会看到的页面上。
 *
 * 两个形态：
 *   - `variant="docked"`：固定贴在视口右下角（登录 / 注册页，宽屏）。
 *     PC 上内容面板靠左，右下角是唯一不会遮住表单的大块留白。
 *   - `variant="inline"`：作为普通流内块（账户页 Hero 下方）。
 * 窄屏一律退回 inline，避免在手机上压住输入框。
 */
withDefaults(
  defineProps<{
    /** docked = 固定在右下角；inline = 跟随文档流。 */
    variant?: 'docked' | 'inline'
  }>(),
  { variant: 'docked' },
)

/** 默认展开：这是「登录不进来该怎么办」的唯一说明，收起来等于让人看不到。 */
const open = ref(true)
/** 用户手动关掉后本次访问不再出现（刷新会重来，不做持久化——这不是骚扰式弹窗）。 */
const dismissed = ref(false)

const contact = 'justqiyi@qq.com'

/**
 * 窄屏下公告是 fixed 贴底通栏，不占布局空间。给 <html> 挂个标记，
 * 让页面外壳（IdLayout / IdSiteShell）据此在底部留出等高留白，
 * 否则展开后会把表单最下面一行压住。
 */
const NOTICE_CLASS = 'id-has-notice'
const NOTICE_HEIGHT_VAR = '--id-notice-h'

const el = useTemplateRef<HTMLElement>('notice')

/*
 * 把公告的实际高度写进 CSS 变量，让页面外壳按真实尺寸留白。
 *
 * 不能写死一个常数：桌面端公告是右下角小卡片，窄屏是贴底通栏，
 * 而通栏的高度又随文案换行而变（390px 宽时 176px，887px 宽时 120px）。
 * 写死 148px 的结果是手机上页脚仍被盖住。
 */
watchEffect((onCleanup) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle(NOTICE_CLASS, !dismissed.value)

  const node = el.value
  if (!node) {
    root.style.removeProperty(NOTICE_HEIGHT_VAR)
    return
  }

  const apply = () => {
    const height = node.getBoundingClientRect().height
    root.style.setProperty(NOTICE_HEIGHT_VAR, `${Math.ceil(height)}px`)
  }

  apply()
  const observer = new ResizeObserver(apply)
  observer.observe(node)

  onCleanup(() => {
    observer.disconnect()
    root.style.removeProperty(NOTICE_HEIGHT_VAR)
  })
})
</script>

<template>
  <aside
    v-if="!dismissed"
    ref="notice"
    class="notice"
    :class="[`notice--${variant}`, { 'notice--open': open }]"
    aria-label="登录方式变更公告"
  >
    <div class="notice__head">
      <button
        class="notice__toggle"
        type="button"
        :aria-expanded="open"
        aria-controls="id-auth-notice-body"
        @click="open = !open"
      >
        <span class="notice__badge md-typescale-label-small">公告</span>
        <span class="notice__title md-typescale-label-large">登录方式已升级</span>
        <M3Icon :icon="IconExpandMore" :size="18" class="notice__chevron" />
      </button>
      <button class="notice__close" type="button" aria-label="关闭公告" @click="dismissed = true">
        <M3Icon :icon="IconClose" :size="16" />
      </button>
    </div>

    <div v-show="open" id="id-auth-notice-body" class="notice__body md-typescale-body-small">
      <p>
        原先基于 Casdoor 的第三方登录已弃用，现改用自建身份中心。
        如果你过去只用第三方账号登录、从未设置过本站密码，可能会暂时无法登录。
      </p>
      <p>
        请先试一次<strong>找回密码</strong>，用注册邮箱重置。
        如果收不到重置邮件、或注册邮箱已经不能用了，再发信到
        <a class="notice__mail" :href="`mailto:${contact}?subject=登录方式变更协助`">
          <M3Icon :icon="IconMail" :size="14" />{{ contact }}
        </a>
        ，请一并说明你注册时用的邮箱或账号，我们会协助你恢复访问。
      </p>
    </div>
  </aside>
</template>

<style scoped>
.notice {
  border-radius: var(--md-sys-shape-corner-large);
  border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
  background-color: color-mix(in srgb, var(--md-sys-color-surface-container-high) 88%, transparent);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: var(--md-sys-elevation-level1);
  overflow: hidden;
}

@supports not (backdrop-filter: blur(1px)) {
  .notice {
    background-color: var(--md-sys-color-surface-container-high);
  }
}

/* ---------- docked：视口右下角 ---------- */
.notice--docked {
  position: fixed;
  inset-block-end: 20px;
  inset-inline-end: 20px;
  z-index: 5;
  width: min(360px, calc(100vw - 40px));
}

/* ---------- inline：文档流内 ---------- */
.notice--inline {
  width: 100%;
}

.notice__head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-inline-end: 6px;
}

.notice__toggle {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 4px 10px 12px;
  border: 0;
  background: none;
  color: var(--md-sys-color-on-surface);
  font: inherit;
  text-align: start;
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-large);
}

.notice__toggle:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.notice__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.notice__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice__chevron {
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
  transition: transform var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.notice--open .notice__chevron {
  transform: rotate(180deg);
}

.notice__close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--md-sys-shape-corner-full);
  background: none;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
}

.notice__close:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent);
}

.notice__body {
  margin: 0;
  padding: 0 12px 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.notice__body p {
  margin: 0 0 8px;
  line-height: 1.55;
}

.notice__body p:last-child {
  margin-block-end: 0;
}

.notice__mail {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--md-sys-color-primary);
  font-weight: 500;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.notice__mail:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

/*
 * 窄屏：仍然 fixed，但贴到底部通栏。
 *
 * 不能退回 position: static —— 登录 / 注册页的外壳是 height: 100dvh + overflow: hidden，
 * 面板吃掉整屏，紧跟其后的静态元素会被直接裁在视口外，公告等于不存在。
 * 贴底通栏是唯一能在这套布局里稳定露出的位置；展开时限制高度并允许内部滚动。
 */
@media (max-width: 900px) {
  .notice--docked {
    inset-block-end: 0;
    inset-inline: 0;
    width: 100%;
    max-height: 60dvh;
    display: flex;
    flex-direction: column;
    border-radius: var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) 0 0;
    border-block-end: 0;
  }

  .notice--docked .notice__body {
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>