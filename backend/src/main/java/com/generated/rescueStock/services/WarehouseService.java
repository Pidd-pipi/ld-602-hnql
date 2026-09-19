package com.generated.rescueStock.services;

import com.generated.rescueStock.constructors.WarehouseDtoFactory;
import com.generated.rescueStock.repositories.WarehouseMapper;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WarehouseService {
  private final WarehouseMapper mapper;

  public WarehouseService(WarehouseMapper mapper) { this.mapper = mapper; }

  public List<Map<String, Object>> list() {
    return mapper.selectList(null).stream().map(WarehouseDtoFactory::toResponse).toList();
  }
}
