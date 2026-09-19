import type { InventoryBatch } from "../types/InventoryBatch";

export const createDefaultInventoryBatch = (overrides: Partial<InventoryBatch> = {}): InventoryBatch => ({
  id: 0,
  warehouse_id: 0,
  warehouse_name: "",
  supply_item_id: 0,
  item_name: "",
  unit: "",
  batch_no: "",
  quantity: 0,
  expire_at: "",
  inbound_source: "",
  quality_status: "PENDING_QC",
  bucket: "FROZEN",
  dispatchable: false,
  ...overrides
});

export interface InboundFormState {
  warehouseId: number | null;
  supplyItemId: number | null;
  batchNo: string;
  quantity: number;
  expireAt: string;
  inboundSource: string;
}

/** 入库表单默认值：新批次一律待检入库，质检合格后才可拨。 */
export const createInboundForm = (overrides: Partial<InboundFormState> = {}): InboundFormState => ({
  warehouseId: null,
  supplyItemId: null,
  batchNo: "",
  quantity: 1,
  expireAt: "",
  inboundSource: "手工入库",
  ...overrides
});

export const createInventoryBatchResponse = createDefaultInventoryBatch;
