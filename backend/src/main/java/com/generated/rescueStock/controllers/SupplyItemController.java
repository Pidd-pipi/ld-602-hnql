package com.generated.rescueStock.controllers;

import com.generated.rescueStock.routes.SupplyItemRoutes;
import com.generated.rescueStock.services.SupplyItemService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(SupplyItemRoutes.PATH)
public class SupplyItemController {
  private final SupplyItemService service;

  public SupplyItemController(SupplyItemService service) { this.service = service; }

  @GetMapping
  public List<Map<String, Object>> list() { return service.list(); }
}
