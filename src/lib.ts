/**
 * 库入口：四个前端应用按需 import 组件与页面，样式单独引入。
 *
 *   import { IdCard, IdField, LoginPage } from '@cloudery/identity-ui'
 *   import '@cloudery/identity-ui/style.css'
 *
 * 不引 UI 框架、不引 casdoor-js-sdk（§13.4）：组件自带样式，颜色全走 CSS 变量。
 */
import './styles/tokens.css'
import './styles/base.css'

export * from './components'
export * from './pages'
export { useTheme, type ThemeMode } from './composables/useTheme'
export { identityApi, isApiError, type ApiError, type CurrentUser, type ExternalProvider } from './api/client'
