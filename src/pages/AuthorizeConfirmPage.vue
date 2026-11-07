<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowForward, IconError, IconLogin, IconSwapHoriz } from '@/icons'
import IdCard from '@/components/IdCard.vue'
import IdLayout from '@/components/IdLayout.vue'
import { M3Avatar, M3Button, M3Icon } from '@clderystd/m3-ui'
import { useSession } from '@/composables/useSession'
import { identityApi, isApiError } from '@/api/client'

/**
 * 授权确认页（方案 A）。
 *
 * 已登录用户从 /login/oauth/authorize 过来时**不再被静默发码**：先在这里看一眼
 * 「这次会用哪个账号登录」，倒计时结束（默认 5 秒）或点「继续」才真正签发授权码。
 * 语义与 Natayark 账户中心的「你想切换账户吗？(2s)」一致——多账号 / 共用设备时，
 * 静默发码等于把上一个登录者的身份带进站。
 *
 * 地址里只有一枚不透明票据：redirect_uri 与 state 都在服务端，前端拿不到，
 * 所以这张页面不可能被改成「把授权码送到任意站点」的开放重定向。
 *
 * 「登录其他账户」= 登出并回登录页：票据绑定的是当前账号，换号后这张票据本来就作废，
 * 留着它只会得到「与当前账号不匹配」，不如干净地断开会话。
 */

const route = useRoute()
const router = useRouter()
const session = useSession()

const ticket = computed(() => {
  const value = route.query.ticket
  return typeof value === 'string' ? value : ''
})

/** 服务端下发的倒计时秒数；0 表示不自动继续。 */
const totalSeconds = ref(identityApi.authorizeConfirmSeconds())
const remaining = ref(totalSeconds.value)

const submitting = ref(false)
const error = ref('')

let timer = 0
let deadline = 0

const user = computed(() => session.user.value)

/** 倒计时进度（1 → 0），用于那根细进度条；不自动继续时恒为 0。 */
const progress = computed(() =>
  totalSeconds.value > 0 ? Math.max(0, remaining.value / totalSeconds.value) : 0,
)

onMounted(async () => {
  // 倒计时以服务端值为准（路由守卫已经拉过一次 status，这里再确认一次不会多花时间）
  const current = await session.ensureLoaded()
  totalSeconds.value = identityApi.authorizeConfirmSeconds()

  // 没有会话就没有「当前账户」可确认：回登录页，登录后还能回到这张页面（票据仍在有效期内）
  if (!current) {
    await router.replace({ path: '/login', query: { returnUrl: route.fullPath } })
    return
  }

  remaining.value = totalSeconds.value

  if (!ticket.value) {
    error.value = '缺少授权信息，请回到原站点重新登录。'
    return
  }

  if (totalSeconds.value > 0) startCountdown()
})

onBeforeUnmount(stopCountdown)

function startCountdown() {
  stopCountdown()
  deadline = Date.now() + totalSeconds.value * 1000

  // 250ms 一跳：秒数按整秒显示，但进度条走得平滑（用两帧之间不抖动的时间差算剩余）
  timer = window.setInterval(() => {
    const left = Math.max(0, deadline - Date.now())
    remaining.value = Math.ceil(left / 1000)

    if (left <= 0) {
      stopCountdown()
      void confirm()
    }
  }, 250)
}

function stopCountdown() {
  if (timer) {
    window.clearInterval(timer)
    timer = 0
  }
}

async function confirm() {
  if (submitting.value || !ticket.value) return
  stopCountdown()
  submitting.value = true
  error.value = ''

  try {
    // 服务端把 code 拼在应用自己的回调地址上还回来；这里整页跳过去，
    // 与前端拼授权地址、回调换会话的既有接线完全一致。
    const redirectUrl = await identityApi.confirmAuthorize(ticket.value)
    window.location.assign(redirectUrl)
  } catch (failure) {
    submitting.value = false
    if (isApiError(failure) && failure.status === 401) {
      // 会话在确认途中失效：回登录页，登录后还能回到这张页面（票据仍在有效期）
      await router.replace({ path: '/login', query: { returnUrl: route.fullPath } })
      return
    }
    error.value = isApiError(failure) ? failure.detail : '网络异常，请稍后重试'
  }
}

/** 换号：登出当前会话再回登录页。票据属于上一个账号，登出后自然作废。 */
async function switchAccount() {
  stopCountdown()
  submitting.value = true
  try {
    await identityApi.signOut()
  } catch {
    // 登出失败也要断开本地状态：否则页面还显示着「已登录的那个人」
  } finally {
    session.clear()
    await router.replace('/login')
  }
}
</script>

<template>
  <IdLayout>
    <IdCard>
      <template #header>
        <p class="auth-confirm__eyebrow md-typescale-label-medium">云术身份中心</p>
        <h1 class="auth-confirm__title md-typescale-headline-medium">
          你想切换账户吗？<span v-if="totalSeconds > 0" class="auth-confirm__count">({{ remaining }}s)</span>
        </h1>
        <p class="auth-confirm__subtitle md-typescale-body-medium">
          <template v-if="totalSeconds > 0">倒计时完成后，以下账户将继续用于登录。</template>
          <template v-else>请确认以下账户，然后继续。</template>
        </p>
      </template>

      <div v-if="error" class="auth-confirm__error" role="alert">
        <M3Icon :icon="IconError" :size="20" />
        <div class="auth-confirm__error-body">
          <p class="auth-confirm__error-text md-typescale-body-medium">{{ error }}</p>
          <M3Button variant="text" size="sm" :icon="IconLogin" @click="router.replace('/login')">
            回到登录页
          </M3Button>
        </div>
      </div>

      <template v-else>
        <!-- 账户卡：头像 + 昵称 + 邮箱，与 Natayark 那一屏的信息结构一致 -->
        <div class="auth-confirm__account">
          <M3Avatar :src="user?.avatar ?? undefined" :name="user?.username" :size="56" />
          <div class="auth-confirm__account-text">
            <p class="auth-confirm__name md-typescale-title-medium">{{ user?.username || '当前账户' }}</p>
            <p class="auth-confirm__email md-typescale-body-medium">{{ user?.email || '未绑定邮箱' }}</p>
          </div>
        </div>

        <!-- 倒计时进度：只做视觉提示，秒数在标题里 -->
        <div v-if="totalSeconds > 0" class="auth-confirm__track" aria-hidden="true">
          <div class="auth-confirm__fill" :style="{ transform: 'scaleX(' + progress + ')' }"></div>
        </div>

        <div class="auth-confirm__actions">
          <M3Button
            variant="filled"
            size="lg"
            block
            :loading="submitting"
            :trailing-icon="IconArrowForward"
            @click="confirm"
          >
            使用此账户继续
          </M3Button>

          <M3Button
            variant="outlined"
            size="lg"
            block
            :icon="IconSwapHoriz"
            :disabled="submitting"
            @click="switchAccount"
          >
            登录其他账户
          </M3Button>
        </div>
      </template>

      <template #footer>
        <p class="auth-confirm__legal">
          确认后你将带着当前账户回到发起登录的站点。若这不是你的账户，请选择「登录其他账户」。
        </p>
      </template>
    </IdCard>
  </IdLayout>
</template>

<style scoped>
.auth-confirm__eyebrow {
  margin: 0;
  color: var(--md-sys-color-primary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.auth-confirm__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.auth-confirm__count {
  margin-inline-start: 6px;
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.auth-confirm__subtitle {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

/* ---------- 账户卡 ---------- */
.auth-confirm__account {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  margin-block-end: 16px;
  border-radius: var(--md-sys-shape-corner-large);
  background-color: var(--md-sys-color-surface-container-high);
}

.auth-confirm__account-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.auth-confirm__name,
.auth-confirm__email {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-confirm__name {
  color: var(--md-sys-color-on-surface);
}

.auth-confirm__email {
  color: var(--md-sys-color-on-surface-variant);
}

/* ---------- 倒计时进度 ---------- */
.auth-confirm__track {
  height: 4px;
  margin-block-end: 20px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  overflow: hidden;
}

.auth-confirm__fill {
  height: 100%;
  transform-origin: left center;
  border-radius: inherit;
  background-color: var(--md-sys-color-primary);
  /* 每 250ms 由脚本更新一次；过渡时长与更新间隔一致，看起来是连续收缩 */
  transition: transform 250ms linear;
}

/* ---------- 操作 ---------- */
.auth-confirm__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ---------- 错误 ---------- */
.auth-confirm__error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: color-mix(in srgb, var(--md-sys-color-error-container) 70%, transparent);
  color: var(--md-sys-color-on-error-container);
}

.auth-confirm__error-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.auth-confirm__error-text {
  margin: 0;
}

.auth-confirm__legal {
  margin: 0;
}
</style>
