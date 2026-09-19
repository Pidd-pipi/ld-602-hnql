package com.generated.rescueStock.controllers;

import com.generated.rescueStock.routes.InventoryBatchRoutes;
import com.generated.rescueStock.services.InventoryBatchService;
import com.generated.rescueStock.types.InboundPayload;
import com.generated.rescueStock.types.QualityCheckPayload;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(InventoryBatchRoutes.PATH)
public class InventoryBatchController {
  private final InventoryBatchService service;

  public InventoryBatchController(InventoryBatchService service) { this.service = service; }

  @GetMapping
  public List<Map<String, Object>> list(@RequestParam(required = false) Long warehouseId) {
    return service.list(warehouseId);
  }

  @GetMapping(InventoryBatchRoutes.SUMMARY)
  public List<Map<String, Object>> summary(@RequestParam(required = false) Long warehouseId) {
    return service.summary(warehouseId);
  }

  @PostMapping(InventoryBatchRoutes.INBOUND)
  public Map<String, Object> inbound(@RequestBody InboundPayload payload) {
    return service.inbound(payload);
  }

  @PostMapping(InventoryBatchRoutes.QUALITY)
  public Map<String, Object> quality(@PathVariable Long id, @RequestBody QualityCheckPayload payload) {
    return service.updateQuality(id, payload);
  }
}
