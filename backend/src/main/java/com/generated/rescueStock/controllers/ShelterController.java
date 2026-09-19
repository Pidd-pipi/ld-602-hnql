package com.generated.rescueStock.controllers;

import com.generated.rescueStock.routes.ShelterRoutes;
import com.generated.rescueStock.services.ShelterService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ShelterRoutes.PATH)
public class ShelterController {
  private final ShelterService service;

  public ShelterController(ShelterService service) { this.service = service; }

  @GetMapping
  public List<Map<String, Object>> list() { return service.list(); }
}
