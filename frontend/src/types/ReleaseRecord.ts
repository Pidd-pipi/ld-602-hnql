export interface ReleaseRecord {
  id: number;
  dispatch_order_id: number;
  batch_id: number;
  batch_no: string;
  warehouse_id: number;
  warehouse_name: string;
  supply_item_id: number;
  item_name: string;
  quantity: number;
  priority: string;
  approved_by: string;
  reason: string;
  created_at: string;
}
