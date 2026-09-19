import { BatchBucket } from '../constants/BatchBucket.js';
import { QualityStatus } from '../constants/QualityStatus.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 批次分区规则（按到期日 + 质检状态派生，不落库）：
 * 1. 待检 / 不合格 → 冻结
 * 2. 已过期（expire_at ≤ now）→ 冻结
 * 3. 距到期 ≤ nearExpiryDays → 临期
 * 4. 其余 → 可用
 */
export function classifyBatch(batch, now, nearExpiryDays) {
  if (batch.quality_status !== QualityStatus.PASSED) return BatchBucket.FROZEN;
  const expireMs = Date.parse(batch.expire_at);
  if (!Number.isFinite(expireMs) || expireMs <= now) return BatchBucket.FROZEN;
  return expireMs <= now + nearExpiryDays * DAY_MS ? BatchBucket.NEAR_EXPIRY : BatchBucket.AVAILABLE;
}

/** 可调拨量只统计 可用 + 临期；待检 / 不合格 / 已过期一律排除。 */
export function isTransferableBucket(bucket) {
  return bucket === BatchBucket.AVAILABLE || bucket === BatchBucket.NEAR_EXPIRY;
}

export function decorateBatch(batch, now, nearExpiryDays) {
  const bucket = classifyBatch(batch, now, nearExpiryDays);
  const expireMs = Date.parse(batch.expire_at);
  return {
    ...batch,
    bucket,
    transferable: isTransferableBucket(bucket),
    days_to_expire: Number.isFinite(expireMs) ? Math.ceil((expireMs - now) / DAY_MS) : null,
  };
}

/** 某仓库某物资当前的可调拨量（可用 + 临期）。 */
export function transferableOfItem(state, warehouseId, itemId, now, nearExpiryDays) {
  return state.batches
    .filter((b) => b.warehouse_id === warehouseId && b.supply_item_id === itemId)
    .filter((b) => isTransferableBucket(classifyBatch(b, now, nearExpiryDays)))
    .reduce((sum, b) => sum + b.quantity, 0);
}

function summarizeWarehouse(state, warehouse, now, nearExpiryDays) {
  const items = state.supply_items
    .map((item) => {
      const batches = state.batches
        .filter((b) => b.warehouse_id === warehouse.id && b.supply_item_id === item.id)
        .map((b) => decorateBatch(b, now, nearExpiryDays));
      if (batches.length === 0) return null;
      const sumBy = (pred) => batches.filter(pred).reduce((sum, b) => sum + b.quantity, 0);
      const availableQty = sumBy((b) => b.bucket === BatchBucket.AVAILABLE);
      const nearExpiryQty = sumBy((b) => b.bucket === BatchBucket.NEAR_EXPIRY);
      const frozenQty = sumBy((b) => b.bucket === BatchBucket.FROZEN);
      const transferableQty = availableQty + nearExpiryQty;
      return {
        supply_item_id: item.id,
        sku_code: item.sku_code,
        name: item.name,
        category: item.category,
        unit: item.unit,
        safety_stock: item.safety_stock,
        available_qty: availableQty,
        near_expiry_qty: nearExpiryQty,
        frozen_qty: frozenQty,
        transferable_qty: transferableQty,
        below_safety: transferableQty < item.safety_stock,
        batches,
      };
    })
    .filter(Boolean);
  const totals = items.reduce(
    (acc, item) => ({
      available_qty: acc.available_qty + item.available_qty,
      near_expiry_qty: acc.near_expiry_qty + item.near_expiry_qty,
      frozen_qty: acc.frozen_qty + item.frozen_qty,
      transferable_qty: acc.transferable_qty + item.transferable_qty,
    }),
    { available_qty: 0, near_expiry_qty: 0, frozen_qty: 0, transferable_qty: 0 },
  );
  return { warehouse_id: warehouse.id, warehouse_name: warehouse.name, district: warehouse.district, totals, items };
}

/** 库存页数据源：三类数量（可用/临期/冻结）+ 可调拨量 + 批次明细。 */
export function buildInventoryView(state, { warehouseId, now, nearExpiryDays }) {
  const warehouses = state.warehouses.filter((w) => warehouseId == null || w.id === warehouseId);
  return {
    generated_at: new Date(now).toISOString(),
    near_expiry_days: nearExpiryDays,
    warehouses: warehouses.map((w) => summarizeWarehouse(state, w, now, nearExpiryDays)),
  };
}
