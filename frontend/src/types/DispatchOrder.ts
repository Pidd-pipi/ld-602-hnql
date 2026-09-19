export interface DispatchLine {
  id: number;
  batch_id: number;
  batch_no: string;
  supply_item_id: number;
  item_name: string;
  quantity: number;
}

export interface DispatchOrder {
  id: number;
  event_id: number | null;
  source_warehouse_id: number;
  warehouse_name: string;
  shelter_id: number;
  shelter_name: string;
  priority: string;
  status: string;
  requested_by: string;
  approved_by: string;
  approve_reason: string;
  reject_reason: string;
  dispatched_at: string;
  created_at: string;
  lines: DispatchLine[];
}
