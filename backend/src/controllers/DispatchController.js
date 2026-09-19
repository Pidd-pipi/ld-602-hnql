import { sendJson } from '../utils/http.js';
import { requirePositiveInt } from '../utils/validate.js';

/** 调拨域控制器：普通申领、应急登记、审批放行、单据查询。 */
export function createDispatchController({ dispatchService }) {
  return {
    async claim(ctx) {
      const result = await dispatchService.claim(ctx.body, ctx.actor);
      sendJson(ctx.res, 201, result);
    },

    async submitEmergency(ctx) {
      const result = await dispatchService.submitEmergency(ctx.body, ctx.actor);
      sendJson(ctx.res, 201, result);
    },

    async release(ctx) {
      const orderId = requirePositiveInt(ctx.params.id, 'id');
      const result = await dispatchService.release(orderId, ctx.body, ctx.actor);
      sendJson(ctx.res, 200, result);
    },

    async list(ctx) {
      const warehouseId = ctx.query.has('warehouse_id') ? Number(ctx.query.get('warehouse_id')) : null;
      const status = ctx.query.get('status') || null;
      sendJson(ctx.res, 200, { orders: dispatchService.listOrders({ warehouseId, status }) });
    },
  };
}
