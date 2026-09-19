import { QualityStatus } from '../constants/QualityStatus.js';

/** 库存批次默认构造器：入库 DTO → 持久化实体。 */
export function createBatch({
  id,
  warehouse_id,
  supply_item_id,
  batch_no,
  quantity,
  expire_at,
  inbound_source = '',
  quality_status = QualityStatus.PENDING_QC,
  created_at,
}) {
  return {
    id,
    warehouse_id,
    supply_item_id,
    batch_no,
    quantity,
    expire_at,
    inbound_source,
    quality_status,
    created_at,
  };
}
