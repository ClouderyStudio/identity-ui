import {
  IconApple,
  IconBilibili,
  IconCloudflare,
  IconDiscord,
  IconGitee,
  IconGithub,
  IconGitlab,
  IconGoogle,
  IconLink,
  IconMicrosoft,
  IconQq,
  IconTelegram,
  IconWechat,
  IconXBrand,
  type IconComponent,
} from '@/icons'

/**
 * 第三方平台标识 → 品牌图标。
 *
 * 后端只回一个 `icon` 字符串（或平台标识 name），这里映射到 Simple Icons；
 * 认不出来就用通用链接图标 —— 登录页**绝不**向外站拉 favicon（隐私上不该这么做）。
 */
const registry: Record<string, IconComponent> = {
  github: IconGithub,
  gitlab: IconGitlab,
  gitee: IconGitee,
  qq: IconQq,
  wechat: IconWechat,
  weixin: IconWechat,
  bilibili: IconBilibili,
  google: IconGoogle,
  discord: IconDiscord,
  telegram: IconTelegram,
  microsoft: IconMicrosoft,
  apple: IconApple,
  cloudflare: IconCloudflare,
  x: IconXBrand,
  twitter: IconXBrand,
}

export interface ProviderGlyph {
  icon: IconComponent
  /** true = 没有匹配到品牌图标，用的是通用图标。 */
  generic: boolean
}

/** 先按显式 icon 找，再退回按平台标识 name 找。 */
export function resolveProviderGlyph(icon?: string | null, name?: string | null): ProviderGlyph {
  const explicit = (icon ?? '').trim().toLowerCase()
  const fallback = (name ?? '').trim().toLowerCase()
  const hit = registry[explicit] ?? registry[fallback]
  return hit ? { icon: hit, generic: false } : { icon: IconLink, generic: true }
}
