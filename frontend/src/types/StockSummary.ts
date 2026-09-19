export interface StockSummary {
  warehouse_id: number;
  supply_item_id: number;
  item_name: string;
  sku_code: string;
  category: string;
  unit: string;
  safety_stock: number;
  /** 可用数量（合格且效期充裕） */
  available: number;
  /** 临期数量（合格但临近到期） */
  near_expiry: number;
  /** 冻结数量（待检 / 不合格 / 已过期，不得调拨） */
  frozen: number;
  /** 可调拨量 = 可用 + 临期 */
  dispatchable: number;
  below_safety: boolean;
}
