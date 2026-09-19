package com.generated.rescueStock.constructors;

import com.generated.rescueStock.models.SupplyItem;
import java.util.LinkedHashMap;
import java.util.Map;

/** 库存汇总响应构造：按 仓库×物资 聚合可用/临期/冻结三类数量。 */
public final class StockSummaryDtoFactory {
  private StockSummaryDtoFactory() {}

  public static Map<String, Object> row(Long warehouseId, SupplyItem item,
                                        int available, int nearExpiry, int frozen) {
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("warehouse_id", warehouseId);
    dto.put("supply_item_id", item.id);
    dto.put("item_name", item.name);
    dto.put("sku_code", item.skuCode);
    dto.put("category", item.category);
    dto.put("unit", item.unit);
    dto.put("safety_stock", item.safetyStock);
    dto.put("available", available);
    dto.put("near_expiry", nearExpiry);
    dto.put("frozen", frozen);
    // 可调拨量严格排除待检/不合格/已过期
    dto.put("dispatchable", available + nearExpiry);
    dto.put("below_safety", available + nearExpiry < item.safetyStock);
    return dto;
  }
}
