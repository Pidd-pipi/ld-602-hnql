package com.generated.rescueStock.models;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("shelter")
public class Shelter {
  @TableId(type = IdType.AUTO)
  public Long id;
  public String name;
  public String district;
  public Integer capacity;
  public Integer currentPopulation;
  public String contactPerson;
  public String riskLevel;
  public String openStatus;
}
