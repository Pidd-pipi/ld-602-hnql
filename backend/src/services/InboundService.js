import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { errorMessage } from '../constants/errorMessages.js';
import { LOG_TEMPLATES, formatLog } from '../constants/logTemplates.js';
import { QUALITY_STATUS_VALUES } from '../constants/QualityStatus.js';
import { createBatch, createAuditEntry } from '../constructors/index.js';
import {
  requirePositiveInt,
  requireNonEmptyString,
  requireISODate,
  requireEnum,
} from '../utils/validate.js';

function notFound(what) {
  return new ApiError(404, ERROR_CODES.NOT_FOUND, errorMessage(ERROR_CODES.NOT_FOUND, what));
}

/**
 * 批次入库：落库后由 InventoryService 按到期日 + 质检状态自动分区。
 * 入库本身在互斥锁内执行，与调拨扣减串行化。
 */
export function createInboundService({ store, mutex, now = () => Date.now() }) {
  async function inboundBatch(dto, actor) {
    return mutex.runExclusive(() => {
      const state = store.state;
      const warehouseId = requirePositiveInt(dto.warehouse_id, 'warehouse_id');
      const itemId = requirePositiveInt(dto.supply_item_id, 'supply_item_id');
      if (!state.warehouses.some((w) => w.id === warehouseId)) throw notFound(`仓库 ${warehouseId}`);
      if (!state.supply_items.some((i) => i.id === itemId)) throw notFound(`物资 ${itemId}`);

      const batch = createBatch({
        id: store.nextId('batch'),
        warehouse_id: warehouseId,
        supply_item_id: itemId,
        batch_no: requireNonEmptyString(dto.batch_no, 'batch_no'),
        quantity: requirePositiveInt(dto.quantity, 'quantity'),
        expire_at: requireISODate(dto.expire_at, 'expire_at'),
        inbound_source: typeof dto.inbound_source === 'string' ? dto.inbound_source : '',
        quality_status: requireEnum(dto.quality_status, QUALITY_STATUS_VALUES, 'quality_status'),
        created_at: new Date(now()).toISOString(),
      });
      state.batches.push(batch);
      state.audit_log.push(
        createAuditEntry({
          id: store.nextId('audit'),
          actor: actor || 'system',
          action: 'BATCH_INBOUND',
          target_type: 'inventory_batch',
          target_id: batch.id,
          detail: formatLog(LOG_TEMPLATES.BATCH_INBOUND, batch.batch_no, batch.quantity, batch.quality_status),
          created_at: batch.created_at,
        }),
      );
      store.persist();
      return batch;
    });
  }

  return { inboundBatch };
}
