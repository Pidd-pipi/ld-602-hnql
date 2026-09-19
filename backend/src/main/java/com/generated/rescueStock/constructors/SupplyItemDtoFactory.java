package com.generated.rescueStock.constructors;

import com.generated.rescueStock.models.SupplyItem;
import java.util.LinkedHashMap;
import java.util.Map;

public final class SupplyItemDtoFactory {
  private SupplyItemDtoFactory() {}

  public static Map<String, Object> toResponse(SupplyItem item) {
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("id", item.id);
    dto.put("sku_code", item.skuCode);
    dto.put("name", item.name);
    dto.put("category", item.category);
    dto.put("unit", item.unit);
    dto.put("safety_stock", item.safetyStock);
    dto.put("expire_days", item.expireDays);
    dto.put("storage_requirement", item.storageRequirement);
    return dto;
  }
}
