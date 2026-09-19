import type { ReleaseRecord } from "../types/ReleaseRecord";

export const createDefaultReleaseRecord = (overrides: Partial<ReleaseRecord> = {}): ReleaseRecord => ({
  id: 0,
  dispatch_order_id: 0,
  batch_id: 0,
  batch_no: "",
  warehouse_id: 0,
  warehouse_name: "",
  supply_item_id: 0,
  item_name: "",
  quantity: 0,
  priority: "NORMAL",
  approved_by: "",
  reason: "",
  created_at: "",
  ...overrides
});

export const createReleaseRecordResponse = createDefaultReleaseRecord;
