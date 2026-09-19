package com.generated.rescueStock.services;

import com.generated.rescueStock.models.AuditLog;
import com.generated.rescueStock.repositories.AuditLogMapper;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** 操作日志：所有写操作经此落 audit_log，与库存流水（release_record）双写。 */
@Service
public class AuditLogService {
  private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

  private final AuditLogMapper mapper;

  public AuditLogService(AuditLogMapper mapper) { this.mapper = mapper; }

  public void record(String actor, String action, String targetType, String targetId, String detail) {
    log.info("[audit] {} {} {} {}", actor, action, targetType, targetId);
    AuditLog entry = new AuditLog();
    entry.actor = actor;
    entry.action = action;
    entry.targetType = targetType;
    entry.targetId = targetId;
    entry.detail = detail == null ? "" : detail;
    entry.createdAt = LocalDateTime.now();
    mapper.insert(entry);
  }
}
