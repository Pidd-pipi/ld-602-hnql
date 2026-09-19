package com.generated.rescueStock.constructors;

import com.generated.rescueStock.constants.BatchBucket;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.models.SupplyItem;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.utils.Formatters;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/** 库存批次响应构造：附带三态归属与关联名称，页面不得自行拼装。 */
public final class InventoryBatchDtoFactory {
  private InventoryBatchDtoFactory() {}

  public static Map<String, Object> toResponse(InventoryBatch batch, SupplyItem item, Warehouse warehouse,
                                               LocalDateTime now, int nearExpireDays) {
    BatchBucket bucket = BatchBucket.of(batch.qualityStatus, batch.expireAt, now, nearExpireDays);
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("id", batch.id);
    dto.put("warehouse_id", batch.warehouseId);
    dto.put("warehouse_name", warehouse == null ? "" : warehouse.name);
    dto.put("supply_item_id", batch.supplyItemId);
    dto.put("item_name", item == null ? "" : item.name);
    dto.put("unit", item == null ? "" : item.unit);
    dto.put("batch_no", batch.batchNo);
    dto.put("quantity", batch.quantity);
    dto.put("expire_at", Formatters.dateTime(batch.expireAt));
    dto.put("inbound_source", batch.inboundSource);
    dto.put("quality_status", batch.qualityStatus);
    dto.put("bucket", bucket.name());
    dto.put("dispatchable", bucket != BatchBucket.FROZEN);
    return dto;
  }
}
