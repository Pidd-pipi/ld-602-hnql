import { QualityStatus } from '../constants/QualityStatus.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 演示种子数据：覆盖可用 / 临期 / 冻结（待检、不合格、已过期）全部分区，
 * 仅在数据文件不存在时写入一次，之后以文件为准。
 */
export function buildSeedState(now = Date.now()) {
  const iso = (offsetDays) => new Date(now + offsetDays * DAY_MS).toISOString();
  return {
    seq: { warehouse: 2, supply_item: 3, shelter: 2, batch: 8, order: 0, release: 0, audit: 0 },
    warehouses: [
      { id: 1, name: '中心应急仓库', district: '城西区', status: 'OPEN' },
      { id: 2, name: '城东储备点', district: '城东区', status: 'OPEN' },
    ],
    supply_items: [
      { id: 1, sku_code: 'WATER-550', name: '瓶装饮用水', category: 'WATER', unit: '箱', safety_stock: 100, expire_days: 365, storage_requirement: '阴凉干燥' },
      { id: 2, sku_code: 'FOOD-BISC', name: '压缩饼干', category: 'FOOD', unit: '箱', safety_stock: 50, expire_days: 540, storage_requirement: '常温密封' },
      { id: 3, sku_code: 'MED-KIT', name: '急救包', category: 'MEDICAL', unit: '套', safety_stock: 20, expire_days: 1095, storage_requirement: '常温避光' },
    ],
    shelters: [
      { id: 1, name: '第一中学安置点', district: '城西区', open_status: 'OPEN' },
      { id: 2, name: '体育馆安置点', district: '城东区', open_status: 'STANDBY' },
    ],
    batches: [
      { id: 1, warehouse_id: 1, supply_item_id: 1, batch_no: 'W2026-001', quantity: 500, expire_at: iso(180), inbound_source: '集中采购', quality_status: QualityStatus.PASSED, created_at: iso(-10) },
      { id: 2, warehouse_id: 1, supply_item_id: 1, batch_no: 'W2025-118', quantity: 120, expire_at: iso(10), inbound_source: '社会捐赠', quality_status: QualityStatus.PASSED, created_at: iso(-60) },
      { id: 3, warehouse_id: 1, supply_item_id: 1, batch_no: 'W2026-009', quantity: 80, expire_at: iso(90), inbound_source: '集中采购', quality_status: QualityStatus.PENDING_QC, created_at: iso(-1) },
      { id: 4, warehouse_id: 1, supply_item_id: 2, batch_no: 'F2025-204', quantity: 200, expire_at: iso(5), inbound_source: '集中采购', quality_status: QualityStatus.PASSED, created_at: iso(-120) },
      { id: 5, warehouse_id: 1, supply_item_id: 2, batch_no: 'F2024-331', quantity: 60, expire_at: iso(-3), inbound_source: '集中采购', quality_status: QualityStatus.PASSED, created_at: iso(-400) },
      { id: 6, warehouse_id: 1, supply_item_id: 3, batch_no: 'M2026-015', quantity: 40, expire_at: iso(365), inbound_source: '集中采购', quality_status: QualityStatus.REJECTED, created_at: iso(-2) },
      { id: 7, warehouse_id: 1, supply_item_id: 3, batch_no: 'M2025-077', quantity: 90, expire_at: iso(200), inbound_source: '集中采购', quality_status: QualityStatus.PASSED, created_at: iso(-30) },
      { id: 8, warehouse_id: 2, supply_item_id: 1, batch_no: 'W2026-101', quantity: 150, expire_at: iso(60), inbound_source: '集中采购', quality_status: QualityStatus.PASSED, created_at: iso(-5) },
    ],
    orders: [],
    releases: [],
    audit_log: [],
  };
}

export function emptyState() {
  return {
    seq: {},
    warehouses: [],
    supply_items: [],
    shelters: [],
    batches: [],
    orders: [],
    releases: [],
    audit_log: [],
  };
}
