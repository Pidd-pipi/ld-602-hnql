package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("release_record")
public class ReleaseRecord {
  @TableId(type = IdType.AUTO)
  public Long id;
  public Long dispatchOrderId;
  public Long batchId;
  public Long warehouseId;
  public Long supplyItemId;
  public Integer quantity;
  public String priority;
  public String approvedBy;
  public String reason;
  public LocalDateTime createdAt;
}
