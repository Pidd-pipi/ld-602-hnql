package com.generated.rescueStock.controllers;

import com.generated.rescueStock.routes.WarehouseRoutes;
import com.generated.rescueStock.services.WarehouseService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(WarehouseRoutes.PATH)
public class WarehouseController {
  private final WarehouseService service;

  public WarehouseController(WarehouseService service) { this.service = service; }

  @GetMapping
  public List<Map<String, Object>> list() { return service.list(); }
}
