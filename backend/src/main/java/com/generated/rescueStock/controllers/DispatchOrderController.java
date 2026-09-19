package com.generated.rescueStock.controllers;

import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.routes.DispatchOrderRoutes;
import com.generated.rescueStock.services.DispatchOrderService;
import com.generated.rescueStock.types.DispatchApprovePayload;
import com.generated.rescueStock.types.DispatchCreatePayload;
import com.generated.rescueStock.types.DispatchRejectPayload;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(DispatchOrderRoutes.PATH)
public class DispatchOrderController {
  private final DispatchOrderService service;

  public DispatchOrderController(DispatchOrderService service) { this.service = service; }

  @GetMapping
  public List<Map<String, Object>> list() { return service.list(); }

  @PostMapping
  public Map<String, Object> create(@RequestBody DispatchCreatePayload payload) {
    return service.create(payload);
  }

  /** 放行：普通调拨触发安全库存时整单拒绝（已落库 REJECTED），返回 409。 */
  @PostMapping(DispatchOrderRoutes.APPROVE)
  public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody(required = false) DispatchApprovePayload payload) {
    String reason = payload == null ? null : payload.reason();
    Map<String, Object> dto = service.approve(id, reason);
    if (DispatchOrderService.isSafetyRejected(dto)) {
      return ResponseEntity.status(409).body(Map.of(
          "code", ErrorCodes.SAFETY_STOCK_BREACH,
          "message", String.valueOf(dto.get("reject_reason")),
          "order", dto));
    }
    return ResponseEntity.ok(dto);
  }

  @PostMapping(DispatchOrderRoutes.REJECT)
  public Map<String, Object> reject(@PathVariable Long id, @RequestBody DispatchRejectPayload payload) {
    return service.reject(id, payload.reason());
  }
}
