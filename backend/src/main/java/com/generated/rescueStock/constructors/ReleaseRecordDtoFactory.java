package com.generated.rescueStock.constructors;

import com.generated.rescueStock.models.ReleaseRecord;
import com.generated.rescueStock.utils.Formatters;
import java.util.LinkedHashMap;
import java.util.Map;

/** 放行记录响应构造。 */
public final class ReleaseRecordDtoFactory {
  private ReleaseRecordDtoFactory() {}

  public static Map<String, Object> toResponse(ReleaseRecord record, String warehouseName,
                                               String itemName, String batchNo) {
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("id", record.id);
    dto.put("dispatch_order_id", record.dispatchOrderId);
    dto.put("batch_id", record.batchId);
    dto.put("batch_no", batchNo);
    dto.put("warehouse_id", record.warehouseId);
    dto.put("warehouse_name", warehouseName);
    dto.put("supply_item_id", record.supplyItemId);
    dto.put("item_name", itemName);
    dto.put("quantity", record.quantity);
    dto.put("priority", record.priority);
    dto.put("approved_by", record.approvedBy);
    dto.put("reason", record.reason);
    dto.put("created_at", Formatters.dateTime(record.createdAt));
    return dto;
  }
}
