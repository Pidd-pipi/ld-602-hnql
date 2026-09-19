export interface SupplyItem {
  id: number;
  sku_code: string;
  name: string;
  category: string;
  unit: string;
  safety_stock: number;
  expire_days: number;
  storage_requirement: string;
}
