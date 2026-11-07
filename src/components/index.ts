export { default as IdAlert } from './IdAlert.vue'
export { default as IdBackground } from './IdBackground.vue'
export { default as IdButton } from './IdButton.vue'
export { default as IdCard } from './IdCard.vue'
export { default as IdDivider } from './IdDivider.vue'
export { default as IdField } from './IdField.vue'
export { default as IdLayout } from './IdLayout.vue'
export { default as IdLegalPage } from './IdLegalPage.vue'
export { default as IdProviderForm, type ProviderDraft } from './IdProviderForm.vue'
export { default as IdSiteHeader } from './IdSiteHeader.vue'
export { default as IdSiteShell } from './IdSiteShell.vue'

/*
 * 下面这些是**兼容壳**：实现在组件库（@clderystd/m3-ui）里，这里只保留旧名字，
 * 让既有调用点不必改动。新代码请直接用组件库的同名组件：
 *   IdField → M3TextField   IdSelect → M3Select     IdAlert → M3Alert
 *   IdConfirmDialog → M3ConfirmDialog               IdToastHost → M3SnackbarHost
 */

/* ---------- 身份中心专用（在 M3 组件之上组合出来） ---------- */
export { default as IdBrand } from './identity/IdBrand.vue'
export { default as IdConfirmDialog, type ConfirmOptions } from './identity/IdConfirmDialog.vue'
export { default as IdPageHeader } from './identity/IdPageHeader.vue'
export { default as IdProviderButton } from './identity/IdProviderButton.vue'
export { default as IdSelect, type SelectOption } from './identity/IdSelect.vue'
export { default as IdStrengthMeter } from './identity/IdStrengthMeter.vue'
export { default as IdThemeToggle } from './identity/IdThemeToggle.vue'
export { default as IdToastHost } from './identity/IdToastHost.vue'