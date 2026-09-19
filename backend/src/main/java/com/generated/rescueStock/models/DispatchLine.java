package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("dispatch_line")
public class DispatchLine {
  @TableId(type = IdType.AUTO)
  public Long id;
  public Long dispatchOrderId;
  public Long batchId;
  public Long supplyItemId;
  public Integer quantity;
}
