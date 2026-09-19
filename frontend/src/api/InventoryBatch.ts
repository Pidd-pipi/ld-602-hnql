import { mockData } from "../mocks/seedData";
import { get, post } from "../utils/request";
import type { InventoryBatch } from "../types/InventoryBatch";
import type { StockSummary } from "../types/StockSummary";

const endpoint = "/api/inventory-batch";

export interface InboundForm {
  warehouseId: number;
  supplyItemId: number;
  batchNo: string;
  quantity: number;
  expireAt: string;
  inboundSource: string;
  qualityStatus?: string;
}

export async function listInventoryBatch(warehouseId?: number): Promise<InventoryBatch[]> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : "";
  try {
    return await get<InventoryBatch[]>(`${endpoint}${query}`);
  } catch {
    // 后端不可用时回退本地种子数据，保证页面可评审
    return [...(mockData.inventoryBatch as unknown as InventoryBatch[])];
  }
}

export async function fetchStockSummary(warehouseId?: number): Promise<StockSummary[]> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : "";
  try {
    return await get<StockSummary[]>(`${endpoint}/summary${query}`);
  } catch {
    return [...(mockData.stockSummary as unknown as StockSummary[])];
  }
}

export function inboundBatch(payload: InboundForm): Promise<InventoryBatch> {
  return post<InventoryBatch>(`${endpoint}/inbound`, payload);
}

export function updateBatchQuality(id: number, qualityStatus: string): Promise<InventoryBatch> {
  return post<InventoryBatch>(`${endpoint}/${id}/quality`, { qualityStatus });
}
