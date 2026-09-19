import { defineStore } from "pinia";
import {
  approveDispatchOrder,
  createDispatchOrder,
  listDispatchOrder,
  rejectDispatchOrder,
  type DispatchCreateForm
} from "../api/DispatchOrder";
import type { DispatchOrder } from "../types/DispatchOrder";

export const useDispatchOrderStore = defineStore("dispatchOrder", {
  state: () => ({
    rows: [] as DispatchOrder[],
    loading: false,
    error: ""
  }),
  getters: {
    pending: (state) => state.rows.filter((row) => row.status === "SUBMITTED")
  },
  actions: {
    async load() {
      this.loading = true;
      this.error = "";
      try {
        this.rows = await listDispatchOrder();
      } catch (err) {
        this.error = err instanceof Error ? err.message : "加载失败";
      } finally {
        this.loading = false;
      }
    },
    async create(payload: DispatchCreateForm) {
      await createDispatchOrder(payload);
      await this.load();
    },
    /** 放行失败（安全库存拦截 / 并发冲突）时向上抛出，由页面提示；成功后刷新列表。 */
    async approve(id: number, reason: string) {
      await approveDispatchOrder(id, reason);
      await this.load();
    },
    async reject(id: number, reason: string) {
      await rejectDispatchOrder(id, reason);
      await this.load();
    }
  }
});
