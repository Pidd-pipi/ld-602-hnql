package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("dispatch_order")
public class DispatchOrder {
  @TableId(type = IdType.AUTO)
  public Long id;
  public Long eventId;
  public Long sourceWarehouseId;
  public Long shelterId;
  public String priority;
  public String status;
  public String requestedBy;
  public String approvedBy;
  public String approveReason;
  public String rejectReason;
  public LocalDateTime dispatchedAt;
  public LocalDateTime createdAt;
}
