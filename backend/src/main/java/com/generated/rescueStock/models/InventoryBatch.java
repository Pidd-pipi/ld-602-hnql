package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("inventory_batch")
public class InventoryBatch {
  @TableId(type = IdType.AUTO)
  public Long id;
  public Long warehouseId;
  public Long supplyItemId;
  public String batchNo;
  public Integer quantity;
  public LocalDateTime expireAt;
  public String inboundSource;
  public String qualityStatus;
  public LocalDateTime createdAt;
}
