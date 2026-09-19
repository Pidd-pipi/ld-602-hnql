package com.generated.rescueStock.constructors;

import com.generated.rescueStock.models.DispatchLine;
import com.generated.rescueStock.models.DispatchOrder;
import com.generated.rescueStock.utils.Formatters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 调拨单响应构造：订单 + 明细行一次性装配。 */
public final class DispatchOrderDtoFactory {
  private DispatchOrderDtoFactory() {}

  public static Map<String, Object> toResponse(DispatchOrder order, List<DispatchLine> lines,
                                               String warehouseName, String shelterName,
                                               Map<Long, String> batchNos, Map<Long, String> itemNames) {
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("id", order.id);
    dto.put("event_id", order.eventId);
    dto.put("source_warehouse_id", order.sourceWarehouseId);
    dto.put("warehouse_name", warehouseName);
    dto.put("shelter_id", order.shelterId);
    dto.put("shelter_name", shelterName);
    dto.put("priority", order.priority);
    dto.put("status", order.status);
    dto.put("requested_by", order.requestedBy);
    dto.put("approved_by", order.approvedBy == null ? "" : order.approvedBy);
    dto.put("approve_reason", order.approveReason == null ? "" : order.approveReason);
    dto.put("reject_reason", order.rejectReason == null ? "" : order.rejectReason);
    dto.put("dispatched_at", Formatters.dateTime(order.dispatchedAt));
    dto.put("created_at", Formatters.dateTime(order.createdAt));
    dto.put("lines", lines.stream().map(line -> {
      Map<String, Object> row = new LinkedHashMap<String, Object>();
      row.put("id", line.id);
      row.put("batch_id", line.batchId);
      row.put("batch_no", batchNos.getOrDefault(line.batchId, ""));
      row.put("supply_item_id", line.supplyItemId);
      row.put("item_name", itemNames.getOrDefault(line.supplyItemId, ""));
      row.put("quantity", line.quantity);
      return row;
    }).toList());
    return dto;
  }
}
