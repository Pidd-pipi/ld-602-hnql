package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("audit_log")
public class AuditLog {
  @TableId(type = IdType.AUTO)
  public Long id;
  public String actor;
  public String action;
  public String targetType;
  public String targetId;
  public String detail;
  public LocalDateTime createdAt;
}
