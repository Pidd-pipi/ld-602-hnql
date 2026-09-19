import type { DispatchOrder } from "../types/DispatchOrder";

export const createDefaultDispatchOrder = (overrides: Partial<DispatchOrder> = {}): DispatchOrder => ({
  id: 0,
  event_id: null,
  source_warehouse_id: 0,
  warehouse_name: "",
  shelter_id: 0,
  shelter_name: "",
  priority: "NORMAL",
  status: "SUBMITTED",
  requested_by: "",
  approved_by: "",
  approve_reason: "",
  reject_reason: "",
  dispatched_at: "",
  created_at: "",
  lines: [],
  ...overrides
});

export interface DispatchFormLine {
  batchId: number | null;
  quantity: number;
}

export interface DispatchFormState {
  sourceWarehouseId: number | null;
  shelterId: number | null;
  priority: string;
  lines: DispatchFormLine[];
}

/** 调拨表单默认值：一行空明细，普通优先级。 */
export const createDispatchForm = (overrides: Partial<DispatchFormState> = {}): DispatchFormState => ({
  sourceWarehouseId: null,
  shelterId: null,
  priority: "NORMAL",
  lines: [{ batchId: null, quantity: 1 }],
  ...overrides
});

export const createDispatchOrderResponse = createDefaultDispatchOrder;
