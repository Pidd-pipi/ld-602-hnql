package com.generated.rescueStock.services;

import com.generated.rescueStock.constructors.ShelterDtoFactory;
import com.generated.rescueStock.repositories.ShelterMapper;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ShelterService {
  private final ShelterMapper mapper;

  public ShelterService(ShelterMapper mapper) { this.mapper = mapper; }

  public List<Map<String, Object>> list() {
    return mapper.selectList(null).stream().map(ShelterDtoFactory::toResponse).toList();
  }
}
