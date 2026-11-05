/**
 * 库入口：四个前端应用按需 import 组件与页面，样式单独引入。
 *
 *   import { IdCard, IdField, LoginPage } from '@cloudery/identity-ui'
 *   import '@cloudery/identity-ui/style.css'
 *
 * 不引 UI 框架、不引 casdoor-js-sdk（§13.4）：组件自带样式，颜色全部来自
 * Material Design 3 的设计令牌（与 official-site 同一套 m3-color-tokens）。
 */
import '@fontsource-variable/roboto-flex'
import './styles/m3-color-tokens.css'
import './styles/m3-foundations.css'
import './styles/base.css'
import './styles/motion.css'
import './styles/identity.css'

/* M3 组件库（与 official-site 同源） */
export * from './components/m3'

/* 身份中心组件与页面 */
export * from './components'
export * from './pages'
export { useTheme, initTheme, type ThemeMode } from './composables/useTheme'
export { useSession } from './composables/useSession'
export { useModal } from './composables/useModal'
export { vRipple, vReveal } from './directives'
export {
  identityApi,
  identityAdminApi,
  isApiError,
  type ApiError,
  type CurrentUser,
  type AccountProfile,
  type AccountBinding,
  type ExternalProvider,
  type AdminAccount,
  type AdminProvider,
  type AdminProviderInput,
  type SiteRole,
} from './api/client'
