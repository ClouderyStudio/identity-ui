/**
 * 全局提示（MD3 Snackbar）。
 *
 * 实现已上移到组件库的 `useSnackbar()`：提示条本身是站点通用的，
 * SCForge 与身份中心都在用同一套；各自维护一份必然在文案时长、色调上分叉。
 *
 * 这里保留 `useToast` 这个名字只为不动 7 个页面 / 15 处调用；
 * **新代码请直接用组件库的 `useSnackbar()`**（返回字段一致：show / success / error / warning）。
 */
import { useSnackbar } from '@clderystd/m3-ui'

export type { SnackbarTone as ToastTone, SnackbarOptions as ToastOptions, SnackbarMessage as ToastMessage } from '@clderystd/m3-ui'

/** 兼容层：把当前消息暴露成 `current`（旧代码读的是这个名字）。 */
export function useToast() {
  const snackbar = useSnackbar()
  return {
    current: snackbar.current,
    show: snackbar.show,
    dismiss: snackbar.hide,
    success: snackbar.success,
    error: snackbar.error,
    warning: snackbar.warning,
  }
}
