package com.generated.rescueStock.controllers;

import com.generated.rescueStock.routes.ReleaseRecordRoutes;
import com.generated.rescueStock.services.ReleaseRecordService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ReleaseRecordRoutes.PATH)
public class ReleaseRecordController {
  private final ReleaseRecordService service;

  public ReleaseRecordController(ReleaseRecordService service) { this.service = service; }

  @GetMapping(ReleaseRecordRoutes.RECENT)
  public List<Map<String, Object>> recent(@RequestParam(required = false) Long warehouseId,
                                          @RequestParam(defaultValue = "10") int limit) {
    return service.recent(warehouseId, limit);
  }
}
