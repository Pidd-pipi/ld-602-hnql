import { defineStore } from "pinia";
import {
  fetchStockSummary,
  inboundBatch,
  listInventoryBatch,
  updateBatchQuality,
  type InboundForm
} from "../api/InventoryBatch";
import { listRecentReleases } from "../api/ReleaseRecord";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { StockSummary } from "../types/StockSummary";
import type { ReleaseRecord } from "../types/ReleaseRecord";

/** 库存页数据源：批次 + 三类数量汇总 + 最近放行记录，统一从后端加载保证刷新一致。 */
export const useInventoryBatchStore = defineStore("inventoryBatch", {
  state: () => ({
    batches: [] as InventoryBatch[],
    summary: [] as StockSummary[],
    releases: [] as ReleaseRecord[],
    loading: false,
    error: ""
  }),
  getters: {
    totals(state) {
      return state.summary.reduce(
        (acc, row) => ({
          available: acc.available + row.available,
          nearExpiry: acc.nearExpiry + row.near_expiry,
          frozen: acc.frozen + row.frozen,
          dispatchable: acc.dispatchable + row.dispatchable
        }),
        { available: 0, nearExpiry: 0, frozen: 0, dispatchable: 0 }
      );
    }
  },
  actions: {
    async load(warehouseId?: number) {
      this.loading = true;
      this.error = "";
      try {
        const [batches, summary, releases] = await Promise.all([
          listInventoryBatch(warehouseId),
          fetchStockSummary(warehouseId),
          listRecentReleases(warehouseId)
        ]);
        this.batches = batches;
        this.summary = summary;
        this.releases = releases;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "加载失败";
      } finally {
        this.loading = false;
      }
    },
    async inbound(payload: InboundForm, warehouseId?: number) {
      await inboundBatch(payload);
      await this.load(warehouseId);
    },
    async markQuality(id: number, qualityStatus: string, warehouseId?: number) {
      await updateBatchQuality(id, qualityStatus);
      await this.load(warehouseId);
    }
  }
});
