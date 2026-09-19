package com.generated.rescueStock.services;

import com.generated.rescueStock.constructors.SupplyItemDtoFactory;
import com.generated.rescueStock.repositories.SupplyItemMapper;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class SupplyItemService {
  private final SupplyItemMapper mapper;

  public SupplyItemService(SupplyItemMapper mapper) { this.mapper = mapper; }

  public List<Map<String, Object>> list() {
    return mapper.selectList(null).stream().map(SupplyItemDtoFactory::toResponse).toList();
  }
}
