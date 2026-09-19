import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { errorMessage } from '../constants/errorMessages.js';
import { LOG_TEMPLATES, formatLog } from '../constants/logTemplates.js';
import { DispatchStatus } from '../constants/DispatchStatus.js';
import { DispatchPriority } from '../constants/DispatchPriority.js';
import {
  createDispatchOrder,
  createDispatchLine,
  createReleaseRecord,
  createAuditEntry,
} from '../constructors/index.js';
import { classifyBatch, isTransferableBucket, transferableOfItem } from './InventoryService.js';
import { requirePositiveInt, requireNonEmptyString } from '../utils/validate.js';

function notFound(what) {
  return new ApiError(404, ERROR_CODES.NOT_FOUND, errorMessage(ERROR_CODES.NOT_FOUND, what));
}

function conflict(code, ...args) {
  return new ApiError(409, code, errorMessage(code, ...args));
}

/**
 * 调拨闭环：
 * - 普通调拨 claim：校验 → 安全库存检查 → 原子扣减 → 直接放行；
 *   任一校验失败则整单拒绝，库存不变。
 * - 应急调拨 submitEmergency + release：先登记（不动库存），
 *   审批员填写原因后放行；放行时在锁内重新校验批次可调拨量，
 *   并发下只能成功一单，失败方不得改变库存。
 */
export function createDispatchService({ store, mutex, nearExpiryDays, now = () => Date.now() }) {
  const nowIso = () => new Date(now()).toISOString();

  function audit(state, actor, action, targetId, detail) {
    state.audit_log.push({
      id: store.nextId('audit'),
      actor: actor || 'system',
      action,
      target_type: 'dispatch_order',
      target_id: targetId,
      detail,
      created_at: nowIso(),
    });
  }

  /** 合并同批次行并做基础校验，返回带批次引用的行。 */
  function resolveLines(state, warehouseId, rawLines) {
    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, errorMessage(ERROR_CODES.VALIDATION_ERROR, 'lines'));
    }
    const merged = new Map();
    for (const raw of rawLines) {
      const batchId = requirePositiveInt(raw?.batch_id, 'lines.batch_id');
      const quantity = requirePositiveInt(raw?.quantity, 'lines.quantity');
      merged.set(batchId, (merged.get(batchId) || 0) + quantity);
    }
    return [...merged.entries()].map(([batchId, quantity]) => {
      const batch = state.batches.find((b) => b.id === batchId);
      if (!batch || batch.warehouse_id !== warehouseId) throw notFound(`批次 ${batchId}`);
      return createDispatchLine({ batch_id: batchId, supply_item_id: batch.supply_item_id, quantity });
    });
  }

  /**
   * 扣减前校验（在锁内执行，看到的就是最新库存）：
   * 1. 批次必须可调拨（合格且未过期）——待检/不合格/已过期不得进入可调拨量；
   * 2. 批次余量必须充足。
   * 只读不写，失败时库存保持不变。
   */
  function assertLinesFulfillable(state, lines, nowMs) {
    for (const line of lines) {
      const batch = state.batches.find((b) => b.id === line.batch_id);
      const bucket = classifyBatch(batch, nowMs, nearExpiryDays);
      if (!isTransferableBucket(bucket)) {
        throw conflict(ERROR_CODES.BATCH_NOT_TRANSFERABLE, batch.batch_no);
      }
      if (batch.quantity < line.quantity) {
        throw conflict(ERROR_CODES.INSUFFICIENT_STOCK, batch.batch_no);
      }
    }
  }

  /** 普通调拨专属：调拨后任一物资可调拨量低于安全库存 → 整单拒绝。 */
  function assertSafetyStock(state, warehouseId, lines, nowMs) {
    const claimedByItem = new Map();
    for (const line of lines) {
      claimedByItem.set(line.supply_item_id, (claimedByItem.get(line.supply_item_id) || 0) + line.quantity);
    }
    for (const [itemId, claimed] of claimedByItem) {
      const item = state.supply_items.find((i) => i.id === itemId);
      const remaining = transferableOfItem(state, warehouseId, itemId, nowMs, nearExpiryDays) - claimed;
      if (remaining < item.safety_stock) {
        throw conflict(ERROR_CODES.SAFETY_STOCK_VIOLATION, item.name);
      }
    }
  }

  /** 全部校验通过后统一扣减并生成放行记录。 */
  function applyFulfillment(state, order, lines, actor, reason) {
    const releasedAt = nowIso();
    const records = lines.map((line) => {
      const batch = state.batches.find((b) => b.id === line.batch_id);
      batch.quantity -= line.quantity;
      return createReleaseRecord({
        id: store.nextId('release'),
        order_id: order.id,
        priority: order.priority,
        warehouse_id: order.warehouse_id,
        shelter_id: order.shelter_id,
        supply_item_id: line.supply_item_id,
        batch_id: line.batch_id,
        batch_no: batch.batch_no,
        quantity: line.quantity,
        actor,
        reason,
        released_at: releasedAt,
      });
    });
    state.releases.push(...records);
    return records;
  }

  function requireRefs(state, dto) {
    const warehouseId = requirePositiveInt(dto.warehouse_id, 'warehouse_id');
    const shelterId = requirePositiveInt(dto.shelter_id, 'shelter_id');
    if (!state.warehouses.some((w) => w.id === warehouseId)) throw notFound(`仓库 ${warehouseId}`);
    if (!state.shelters.some((s) => s.id === shelterId)) throw notFound(`安置点 ${shelterId}`);
    return { warehouseId, shelterId };
  }

  /** 普通调拨申领：安全库存约束内直接放行；违反则整单拒绝、库存不变。 */
  async function claim(dto, actor) {
    return mutex.runExclusive(() => {
      const state = store.state;
      const { warehouseId, shelterId } = requireRefs(state, dto);
      const requestedBy = requireNonEmptyString(dto.requested_by, 'requested_by');
      const lines = resolveLines(state, warehouseId, dto.lines);
      const nowMs = now();
      try {
        assertLinesFulfillable(state, lines, nowMs);
        assertSafetyStock(state, warehouseId, lines, nowMs);
      } catch (err) {
        if (err instanceof ApiError) {
          audit(state, actor || requestedBy, 'DISPATCH_REJECTED', null, formatLog(LOG_TEMPLATES.DISPATCH_REJECTED, err.message));
          store.persist();
        }
        throw err;
      }
      const order = createDispatchOrder({
        id: store.nextId('order'),
        priority: DispatchPriority.NORMAL,
        status: DispatchStatus.RELEASED,
        warehouse_id: warehouseId,
        shelter_id: shelterId,
        requested_by: requestedBy,
        lines,
        created_at: nowIso(),
      });
      order.released_at = nowIso();
      state.orders.push(order);
      const records = applyFulfillment(state, order, lines, requestedBy, '普通调拨自动放行');
      audit(state, actor || requestedBy, 'DISPATCH_CLAIMED', order.id, formatLog(LOG_TEMPLATES.DISPATCH_CLAIMED, order.id, lines.length));
      store.persist();
      return { order, records };
    });
  }

  /** 应急调拨登记：只建单不动库存，等待审批员放行。 */
  async function submitEmergency(dto, actor) {
    return mutex.runExclusive(() => {
      const state = store.state;
      const { warehouseId, shelterId } = requireRefs(state, dto);
      const requestedBy = requireNonEmptyString(dto.requested_by, 'requested_by');
      const lines = resolveLines(state, warehouseId, dto.lines);
      const order = createDispatchOrder({
        id: store.nextId('order'),
        priority: DispatchPriority.EMERGENCY,
        status: DispatchStatus.SUBMITTED,
        warehouse_id: warehouseId,
        shelter_id: shelterId,
        requested_by: requestedBy,
        lines,
        created_at: nowIso(),
      });
      state.orders.push(order);
      audit(state, actor || requestedBy, 'DISPATCH_SUBMITTED', order.id, formatLog(LOG_TEMPLATES.DISPATCH_SUBMITTED, order.id));
      store.persist();
      return { order };
    });
  }

  /**
   * 应急调拨放行：审批员必须填写原因。
   * 锁内重新校验批次可调拨性（不检查安全库存），并发下只有一单能扣减成功。
   */
  async function release(orderId, dto, approver) {
    return mutex.runExclusive(() => {
      const state = store.state;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) throw notFound(`调拨单 ${orderId}`);
      if (order.status !== DispatchStatus.SUBMITTED) {
        throw conflict(ERROR_CODES.ORDER_STATE_INVALID, order.status);
      }
      const reason = requireNonEmptyString(dto.approve_reason, 'approve_reason');
      const approvedBy = requireNonEmptyString(approver || dto.approved_by, 'approved_by');
      assertLinesFulfillable(state, order.lines, now());
      for (const line of order.lines) {
        const batch = state.batches.find((b) => b.id === line.batch_id);
        line.supply_item_id = batch.supply_item_id;
      }
      order.status = DispatchStatus.RELEASED;
      order.approved_by = approvedBy;
      order.approve_reason = reason;
      order.released_at = nowIso();
      const records = applyFulfillment(state, order, order.lines, approvedBy, reason);
      audit(state, approvedBy, 'DISPATCH_RELEASED', order.id, formatLog(LOG_TEMPLATES.DISPATCH_RELEASED, order.id, approvedBy));
      store.persist();
      return { order, records };
    });
  }

  function listOrders({ warehouseId, status } = {}) {
    return store.state.orders
      .filter((o) => (warehouseId == null || o.warehouse_id === warehouseId))
      .filter((o) => (status == null || o.status === status))
      .slice()
      .sort((a, b) => b.id - a.id);
  }

  /** 最近放行记录：按放行时间倒序，库存页展示。 */
  function listReleases({ warehouseId, limit = 20 } = {}) {
    const state = store.state;
    return state.releases
      .filter((r) => (warehouseId == null || r.warehouse_id === warehouseId))
      .slice()
      .sort((a, b) => (a.released_at === b.released_at ? b.id - a.id : a.released_at < b.released_at ? 1 : -1))
      .slice(0, limit)
      .map((r) => {
        const item = state.supply_items.find((i) => i.id === r.supply_item_id);
        return { ...r, item_name: item ? item.name : null, unit: item ? item.unit : null };
      });
  }

  return { claim, submitEmergency, release, listOrders, listReleases };
}
