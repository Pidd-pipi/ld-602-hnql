package com.generated.rescueStock.constructors;

import com.generated.rescueStock.models.Warehouse;
import java.util.LinkedHashMap;
import java.util.Map;

public final class WarehouseDtoFactory {
  private WarehouseDtoFactory() {}

  public static Map<String, Object> toResponse(Warehouse warehouse) {
    Map<String, Object> dto = new LinkedHashMap<>();
    dto.put("id", warehouse.id);
    dto.put("name", warehouse.name);
    dto.put("district", warehouse.district);
    dto.put("address", warehouse.address);
    dto.put("manager_id", warehouse.managerId);
    dto.put("capacity_level", warehouse.capacityLevel);
    dto.put("contact_phone", warehouse.contactPhone);
    dto.put("status", warehouse.status);
    return dto;
  }
}
