import type { StockSummary } from "../types/StockSummary";

export const createDefaultStockSummary = (overrides: Partial<StockSummary> = {}): StockSummary => ({
  warehouse_id: 0,
  supply_item_id: 0,
  item_name: "",
  sku_code: "",
  category: "FOOD",
  unit: "",
  safety_stock: 0,
  available: 0,
  near_expiry: 0,
  frozen: 0,
  dispatchable: 0,
  below_safety: false,
  ...overrides
});

export const createStockSummaryResponse = createDefaultStockSummary;
