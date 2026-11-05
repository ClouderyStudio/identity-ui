/**
 * 图标中央注册表：全部是 unplugin-icons 在构建期编译出来的内联 SVG 组件，
 * 既不下载图标字体，也不在运行时请求网络。
 *
 *   - 系统图标取自 Google Material Symbols（MD3 的官方图标集）
 *   - 品牌图标取自 Simple Icons，用于第三方登录入口
 *
 * 组件属性一律用下面的 IconComponent 类型；要用新图标就在这里的清单加一行。
 */
import IconAccountCircle from '~icons/material-symbols/account-circle'
import IconApps from '~icons/material-symbols/apps'
import IconArrowBack from '~icons/material-symbols/arrow-back'
import IconArrowForward from '~icons/material-symbols/arrow-forward'
import IconArrowOutward from '~icons/material-symbols/arrow-outward'
import IconArrowUpward from '~icons/material-symbols/arrow-upward'
import IconAutoAwesome from '~icons/material-symbols/auto-awesome'
import IconBadge from '~icons/material-symbols/badge'
import IconBlock from '~icons/material-symbols/block'
import IconBolt from '~icons/material-symbols/bolt'
import IconCheck from '~icons/material-symbols/check'
import IconCheckCircle from '~icons/material-symbols/check-circle'
import IconChevronRight from '~icons/material-symbols/chevron-right'
import IconClose from '~icons/material-symbols/close'
import IconContentCopy from '~icons/material-symbols/content-copy'
import IconDashboard from '~icons/material-symbols/dashboard'
import IconDarkMode from '~icons/material-symbols/dark-mode'
import IconDelete from '~icons/material-symbols/delete'
import IconDomain from '~icons/material-symbols/domain'
import IconEdit from '~icons/material-symbols/edit'
import IconError from '~icons/material-symbols/error'
import IconExpandLess from '~icons/material-symbols/expand-less'
import IconExpandMore from '~icons/material-symbols/expand-more'
import IconFavorite from '~icons/material-symbols/favorite'
import IconFingerprint from '~icons/material-symbols/fingerprint'
import IconGroup from '~icons/material-symbols/group'
import IconGroups from '~icons/material-symbols/groups'
import IconHelp from '~icons/material-symbols/help'
import IconHome from '~icons/material-symbols/home'
import IconHub from '~icons/material-symbols/hub'
import IconInfo from '~icons/material-symbols/info'
import IconKey from '~icons/material-symbols/key'
import IconKeyOff from '~icons/material-symbols/key-off'
import IconLightMode from '~icons/material-symbols/light-mode'
import IconLink from '~icons/material-symbols/link'
import IconLinkOff from '~icons/material-symbols/link-off'
import IconLock from '~icons/material-symbols/lock'
import IconLockOpen from '~icons/material-symbols/lock-open'
import IconLockPerson from '~icons/material-symbols/lock-person'
import IconLockReset from '~icons/material-symbols/lock-reset'
import IconLogin from '~icons/material-symbols/login'
import IconLogout from '~icons/material-symbols/logout'
import IconMail from '~icons/material-symbols/mail'
import IconManageAccounts from '~icons/material-symbols/manage-accounts'
import IconMarkEmailRead from '~icons/material-symbols/mark-email-read'
import IconMenu from '~icons/material-symbols/menu'
import IconMoreVert from '~icons/material-symbols/more-vert'
import IconOpenInNew from '~icons/material-symbols/open-in-new'
import IconOutbox from '~icons/material-symbols/outbox'
import IconPasskey from '~icons/material-symbols/passkey'
import IconPassword from '~icons/material-symbols/password'
import IconPerson from '~icons/material-symbols/person'
import IconPersonAdd from '~icons/material-symbols/person-add'
import IconPersonOff from '~icons/material-symbols/person-off'
import IconRefresh from '~icons/material-symbols/refresh'
import IconRestartAlt from '~icons/material-symbols/restart-alt'
import IconSearch from '~icons/material-symbols/search'
import IconSecurity from '~icons/material-symbols/security'
import IconSettings from '~icons/material-symbols/settings'
import IconShield from '~icons/material-symbols/shield'
import IconShieldOutline from '~icons/material-symbols/shield-outline'
import IconShieldPerson from '~icons/material-symbols/shield-person'
import IconStar from '~icons/material-symbols/star'
import IconSync from '~icons/material-symbols/sync'
import IconTableChart from '~icons/material-symbols/table-chart'
import IconTimer from '~icons/material-symbols/timer'
import IconToggleOn from '~icons/material-symbols/toggle-on'
import IconVerified from '~icons/material-symbols/verified'
import IconVerifiedUser from '~icons/material-symbols/verified-user'
import IconVisibility from '~icons/material-symbols/visibility'
import IconVisibilityOff from '~icons/material-symbols/visibility-off'
import IconVpnKey from '~icons/material-symbols/vpn-key'
import IconWarning from '~icons/material-symbols/warning'
import IconBrightnessAuto from '~icons/material-symbols/brightness-auto'
import IconArrowLeft from '~icons/material-symbols/arrow-left'
import IconChevronLeft from '~icons/material-symbols/chevron-left'
import IconAdd from '~icons/material-symbols/add'
import IconAddCircle from '~icons/material-symbols/add-circle'
import IconSave from '~icons/material-symbols/save'
import IconTune from '~icons/material-symbols/tune'
import IconHistory from '~icons/material-symbols/history'
import IconEvent from '~icons/material-symbols/event'
import IconInsights from '~icons/material-symbols/insights'
import IconHowToReg from '~icons/material-symbols/how-to-reg'
import IconSwapHoriz from '~icons/material-symbols/swap-horiz'
import IconContentPaste from '~icons/material-symbols/content-paste'
import IconFilterList from '~icons/material-symbols/filter-list'
import IconGithub from '~icons/simple-icons/github'
import IconQq from '~icons/simple-icons/qq'
import IconBilibili from '~icons/simple-icons/bilibili'
import IconWechat from '~icons/simple-icons/wechat'
import IconAlipay from '~icons/simple-icons/alipay'
import IconGoogle from '~icons/simple-icons/google'
import IconDiscord from '~icons/simple-icons/discord'
import IconTelegram from '~icons/simple-icons/telegram'
import IconMicrosoft from '~icons/simple-icons/microsoft'
import IconGitlab from '~icons/simple-icons/gitlab'
import IconGitee from '~icons/simple-icons/gitee'
import IconCloudflare from '~icons/simple-icons/cloudflare'
import IconApple from '~icons/simple-icons/apple'
import IconXBrand from '~icons/simple-icons/x'

export {
  IconAccountCircle, IconApps, IconArrowBack, IconArrowForward, IconArrowOutward, IconArrowUpward, IconAutoAwesome, IconBadge,
  IconBlock, IconBolt, IconCheck, IconCheckCircle, IconChevronRight, IconClose, IconContentCopy, IconDashboard,
  IconDarkMode, IconDelete, IconDomain, IconEdit, IconError, IconExpandLess, IconExpandMore, IconFavorite,
  IconFingerprint, IconGroup, IconGroups, IconHelp, IconHome, IconHub, IconInfo, IconKey,
  IconKeyOff, IconLightMode, IconLink, IconLinkOff, IconLock, IconLockOpen, IconLockPerson, IconLockReset,
  IconLogin, IconLogout, IconMail, IconManageAccounts, IconMarkEmailRead, IconMenu, IconMoreVert, IconOpenInNew,
  IconOutbox, IconPasskey, IconPassword, IconPerson, IconPersonAdd, IconPersonOff, IconRefresh, IconRestartAlt,
  IconSearch, IconSecurity, IconSettings, IconShield, IconShieldOutline, IconShieldPerson, IconStar, IconSync,
  IconTableChart, IconTimer, IconToggleOn, IconVerified, IconVerifiedUser, IconVisibility, IconVisibilityOff, IconVpnKey,
  IconWarning, IconBrightnessAuto, IconArrowLeft, IconChevronLeft, IconAdd, IconAddCircle, IconSave, IconTune,
  IconHistory, IconEvent, IconInsights, IconHowToReg, IconSwapHoriz, IconContentPaste, IconFilterList, IconGithub,
  IconQq, IconBilibili, IconWechat, IconAlipay, IconGoogle, IconDiscord, IconTelegram, IconMicrosoft,
  IconGitlab, IconGitee, IconCloudflare, IconApple, IconXBrand,
}

/** unplugin-icons 编出来的 SVG 组件形状，用来给组件属性标注类型。 */
export type IconComponent = (typeof IconCheck)
