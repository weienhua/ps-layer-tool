import { inject } from "vue";

/** 获取 Toast 方法（需在 ToastProvider 内使用） */
export function useToast() {
  const showToast = inject<(msg: string, isError?: boolean) => void>("showToast");
  if (!showToast) {
    // fallback: 降级到 console
    return (msg: string, isError = false) => {
      if (isError) console.error("[Toast]", msg);
      else console.log("[Toast]", msg);
    };
  }
  return showToast;
}
