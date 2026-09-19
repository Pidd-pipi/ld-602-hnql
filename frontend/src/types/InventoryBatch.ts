export interface InventoryBatch {
  id: number;
  warehouse_id: number;
  warehouse_name: string;
  supply_item_id: number;
  item_name: string;
  unit: string;
  batch_no: string;
  quantity: number;
  expire_at: string;
  inbound_source: string;
  quality_status: string;
  /** 三态归属：AVAILABLE 可用 / NEAR_EXPIRY 临期 / FROZEN 冻结 */
  bucket: string;
  /** 是否计入可调拨量（待检、不合格、已过期均为 false） */
  dispatchable: boolean;
}
