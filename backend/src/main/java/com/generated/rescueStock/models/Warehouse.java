package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("warehouse")
public class Warehouse {
  @TableId(type = IdType.AUTO)
  public Long id;
  public String name;
  public String district;
  public String address;
  public String managerId;
  public String capacityLevel;
  public String contactPhone;
  public String status;
}
