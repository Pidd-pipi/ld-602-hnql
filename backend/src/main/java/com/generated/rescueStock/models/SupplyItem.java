package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("supply_item")
public class SupplyItem {
  @TableId(type = IdType.AUTO)
  public Long id;
  public String skuCode;
  public String name;
  public String category;
  public String unit;
  public Integer safetyStock;
  public Integer expireDays;
  public String storageRequirement;
}
