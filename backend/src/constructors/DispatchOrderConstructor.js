import { DispatchStatus } from '../constants/DispatchStatus.js';

/** 调拨单默认构造器：普通调拨创建即放行，应急调拨创建为待审批。 */
export function createDispatchOrder({
  id,
  priority,
  status = DispatchStatus.SUBMITTED,
  warehouse_id,
  shelter_id,
  requested_by,
  lines,
  created_at,
}) {
  return {
    id,
    priority,
    status,
    warehouse_id,
    shelter_id,
    requested_by,
    approved_by: null,
    approve_reason: null,
    lines,
    created_at,
    released_at: null,
  };
}

export function createDispatchLine({ batch_id, supply_item_id, quantity }) {
  return { batch_id, supply_item_id, quantity };
}
