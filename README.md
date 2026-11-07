# 云术身份中心 · identity-ui

云术工作室的统一身份界面：登录 / 注册 / 找回 / 重置 / 改密 / 账户面板 / 管理后台 / 法务页面。
界面完全按 **Material Design 3** 实现，设计系统与 [official-site](../official-site) 同源：

- 配色 = official-site 生成的 `m3-color-tokens.css`（浅色 / 深色两套完整 M3 角色）
- 字体阶、形状、海拔、动效、状态层 = `m3-foundations.css`
- 组件 = official-site 的 `components/m3` 组件库（M3Button / M3Card / M3Dialog / M3Sheet …）原样复用，
  身份中心特有的东西（MD3 填充输入框、强度条、品牌标识、第三方登录按钮）在这一层新建，
  不另起一套视觉。

## 页面结构

登录类页面（登录 / 注册 / 找回 / 重置 / 改密 / 法务）统一用 `IdLayout`：

- 背景插画铺满整个视口，**不叠任何蒙版**，图片原样呈现；
- 左侧是一块**贴住屏幕左缘、高度严格等于视口**的毛玻璃面板，宽度约 1/4 屏；
- 面板只有高斯模糊 + 一层很薄的表面色（保证文字对比度），背景图不会被压暗；
- 面板内部的正文区自己滚动，页面本身不出现滚动条；
- 窄屏（≤900px）面板铺满整屏，表面加实以保持可读。

账户面板与管理后台用 `IdSiteShell`（顶部应用栏 + 居中宽栏 + 页脚法务行）。

### 授权确认页（`/authorize`）

四个前端应用登录时拼的是 `{endpoint}/login/oauth/authorize`。已登录用户访问这个地址时，
身份中心**不再静默签发授权码**，而是先跳到 `/authorize?ticket=…`：

- 页面上是「你想切换账户吗？(5s)」+ 当前账户卡（头像 / 昵称 / 邮箱）+ 倒计时进度条；
- 倒计时结束或点「使用此账户继续」→ `POST /identity/auth/authorize` 消费票据，
  服务端把 `code` 拼回**应用自己的回调地址**并返回，前端整页跳过去；
- 点「登录其他账户」→ 登出当前会话并回登录页（票据绑定的是上一个账号，登出后自然作废）。

票据是不透明的：`redirect_uri` 与 `state` 只存在服务端，前端拿不到也传不了，
所以这张页面不可能被改成「把授权码送到任意站点」的开放重定向。
倒计时秒数由服务端下发（`Identity:AuthorizeConfirmSeconds`，`GET /identity/auth/status` 里给
`authorizeConfirmSeconds`），`0` 表示必须手动点「继续」。

## 命令

```bash
pnpm dev          # 开发服务器（端口 5176，/identity 与 /connect 代理到 VITE_API_PROXY_TARGET）
pnpm dev:mock     # 演示模式：内存假后端 + 示例数据，不连后端也能点（端口 5180）
pnpm build        # 类型检查 + 生产构建（站点，输出 dist/）
pnpm build:mock   # 演示模式的静态构建（输出 dist-mock/）
pnpm build:lib    # 可复用库（输出 dist-lib/，与站点产物分开）
pnpm typecheck    # 只做类型检查（vue-tsc -b，项目引用模式）
pnpm shots        # 用本机 Edge / Chrome 无头截图到 .review/（需先 pnpm build && pnpm preview）
```

### 演示模式（Mock）

`src/api/mock.ts` 在 `--mode mock` 下替换 `window.fetch`，拦截全部 `/identity/*` 请求并返回
与真实后端同形状的数据：23 个账号、5 个登录方式、6 个分站职权。它是**有状态**的——
停用/启用、改角色、授予站点职权、重置口令、解绑、新建/编辑/删除登录方式都会真的改内存数据，
刷新页面才复位。页面右下角有「演示数据 · Mock」角标，避免和真实数据混淆。

生产构建里 `__MOCK__` 为 `false`，整个 mock 文件会被摇掉（已核对产物里不含任何示例账号）。

截图脚本参数写成 `--flag=value`：`--theme=light|dark|both`、`--only=<名称片段>`、`--url=<地址>`、`--out=<目录>`。
脚本会注入一个假的 `fetch`，让 `/identity/*` 返回示例数据，因此不用连后端就能核对账户面板与管理后台。

## 依赖的组件库

M3 组件来自独立仓库 [m3-ui](../m3-ui)，发布为 `@clderystd/m3-ui`：

- 本仓库只保留身份中心自己的组件与页面，不再有 M3 组件副本
- 配色（`m3-color-tokens.css`）**留在站点**，组件库只带结构令牌 ——
  官方站用蓝色、scforge 用橙色，而组件代码只有一份

依赖来自 npm 公共 registry（`@clderystd/m3-ui@^0.1.0`），升级用 `pnpm update @clderystd/m3-ui`。

本地联调组件库时，可在 `m3-ui` 里 `pnpm build && pnpm pack`，再在本仓库
`pnpm add ../m3-ui/clderystd-m3-ui-0.1.0.tgz` 临时验证；验证完记得改回版本号。

## 目录

```
src/
  components/m3/        official-site 的 M3 组件库（18 个组件 + vRipple 出口）
  components/identity/  身份中心专用：品牌标识 / 页面标题 / 下拉 / 强度条 / 第三方登录按钮 /
                        确认对话框 / 粒子背景 / 主题切换
  components/           IdCard / IdField / IdButton / IdAlert / IdDivider / IdLayout / IdSiteShell /
                        IdLegalPage / IdProviderForm / IdSiteHeader
  pages/                10 个页面（含授权确认页 AuthorizeConfirmPage）
  composables/          useTheme（cloudery-theme 键，.dark 类）/ useSession / useModal
  directives/           v-ripple、v-reveal
  styles/               index.css 入口：字体 → 配色 → 基础 → 动效 → 身份中心补充层
  main.ts / App.vue / router.ts   站点入口、根组件、路由与登录守卫
  icons.ts              图标中央注册表（Material Symbols + Simple Icons）
scripts/screenshot.mjs  视觉核对脚本
```

## 与 official-site 的对应关系

| 官网页 | 身份中心 | 说明 |
| --- | --- | --- |
| `styles/m3-color-tokens.css` | 同名文件 | 直接复用，种子色与角色完全一致 |
| `styles/m3-foundations.css` | 同名文件 | 直接复用 |
| `styles/base.css` / `motion.css` | 同名文件 | 直接复用（含 `.md-typescale-*`、状态层、涟漪、scrim） |
| `components/m3/*` | 同名目录 | 直接复用；只有 M3Button 增加了 `loading`（表单提交需要） |
| `SiteHeader` 的玻璃胶囊 | `IdSiteShell` 顶部栏 | 同一套 overlay + 表面插槽做法 |
| `ParticlesBackground` | `components/identity/ParticlesBackground.vue` | 复用 |
| — | `identity.css` | 新增：毛玻璃面板表面、内容宽度档位、渐变强调字 |

MD3 里没有现成实现的部件，按规范补齐而不是发明样式：

- **输入框**：MD3 filled text field（56dp 容器、浮动标签、底部 1dp/2dp 指示线、错误用 error 角色）
- **下拉**：原生 `<select>` 套同一套填充容器皮肤（键盘与移动端原生选择器直接可用）
- **确认对话框**：用 `M3Dialog` 组合成命令式 `await confirm.ask(...)`，替换 `window.confirm`
- **表格**：MD3 没有 data table 组件，用容器色卡片 + 行分隔线 + 状态层悬浮

## 主题

- 偏好键 `cloudery-theme`（`light | dark | system`），与官网页共用；解析结果写到 `<html class="dark">`。
- `index.html` 内联脚本在首屏前定色，避免闪烁；切换时 `useTheme` 短暂挂上 `.md-theme-transition` 做交叉淡入。
- 组件里不出现任何硬编码颜色，全部引用 `--md-sys-color-*`。

## 无障碍

- 焦点环 = MD3 的 3dp secondary outline + 2dp 偏移（`base.css`）。
- 所有交互元素都有可见标签或 `aria-label`；错误提示用 `aria-describedby` + `aria-invalid` 关联，
  错误级别用 `role="alert"`，其余用 `role="status"`。
- `prefers-reduced-motion: reduce` 只做「削减」：停掉装饰性无限循环（背景缓慢缩放、渐变扫光），
  一次性入场与状态反馈照常保留。
- 截图里 hover / focus 需要真人触发，脚本只保证静态状态无对比度问题。