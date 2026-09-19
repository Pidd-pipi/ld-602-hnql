import { sendJson } from '../utils/http.js';
import { buildInventoryView } from '../services/InventoryService.js';
import { QUALITY_STATUS_TEXT } from '../constants/QualityStatus.js';
import { BATCH_BUCKET_TEXT } from '../constants/BatchBucket.js';
import { DISPATCH_STATUS_TEXT } from '../constants/DispatchStatus.js';
import { DISPATCH_PRIORITY_TEXT } from '../constants/DispatchPriority.js';

/** 库存域控制器：入库、库存视图（三类数量）、最近放行记录、元数据。 */
export function createInventoryController({ store, inboundService, dispatchService, nearExpiryDays, now }) {
  return {
    async inbound(ctx) {
      const batch = await inboundService.inboundBatch(ctx.body, ctx.actor);
      sendJson(ctx.res, 201, { batch });
    },

    async inventory(ctx) {
      const warehouseId = ctx.query.has('warehouse_id') ? Number(ctx.query.get('warehouse_id')) : null;
      const view = buildInventoryView(store.state, { warehouseId, now: now(), nearExpiryDays });
      sendJson(ctx.res, 200, view);
    },

    async releases(ctx) {
      const warehouseId = ctx.query.has('warehouse_id') ? Number(ctx.query.get('warehouse_id')) : null;
      const limit = ctx.query.has('limit') ? Number(ctx.query.get('limit')) : 20;
      sendJson(ctx.res, 200, { records: dispatchService.listReleases({ warehouseId, limit }) });
    },

    async meta(ctx) {
      const state = store.state;
      sendJson(ctx.res, 200, {
        near_expiry_days: nearExpiryDays,
        warehouses: state.warehouses,
        supply_items: state.supply_items,
        shelters: state.shelters,
        quality_status_text: QUALITY_STATUS_TEXT,
        batch_bucket_text: BATCH_BUCKET_TEXT,
        dispatch_status_text: DISPATCH_STATUS_TEXT,
        dispatch_priority_text: DISPATCH_PRIORITY_TEXT,
      });
    },
  };
}
