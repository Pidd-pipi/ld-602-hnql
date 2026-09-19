import { ref } from "vue";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import type { DispatchCreateForm } from "../api/DispatchOrder";
import type { ApiError } from "../utils/request";

/** 调拨流：创建 / 放行 / 驳回的统一提交态与错误信息。 */
export function useDispatchFlow() {
  const store = useDispatchOrderStore();
  const submitting = ref(false);
  const lastError = ref("");
  const lastErrorCode = ref("");

  async function run(action: () => Promise<void>) {
    submitting.value = true;
    lastError.value = "";
    lastErrorCode.value = "";
    try {
      await action();
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      lastError.value = apiError.message ?? "操作失败";
      lastErrorCode.value = apiError.code ?? "";
      return false;
    } finally {
      submitting.value = false;
    }
  }

  const create = (payload: DispatchCreateForm) => run(() => store.create(payload));
  const approve = (id: number, reason: string) => run(() => store.approve(id, reason));
  const reject = (id: number, reason: string) => run(() => store.reject(id, reason));

  return { submitting, lastError, lastErrorCode, create, approve, reject };
}
