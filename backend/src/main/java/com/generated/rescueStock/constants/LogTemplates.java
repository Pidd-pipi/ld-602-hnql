package com.generated.rescueStock.constants;

/**
 * 日志模板集中管理：每个实体至少 4 条，所有写操作必须记录。
 * 字段变更时需同步修改本类与 service 调用处。
 */
public final class LogTemplates {
  private LogTemplates() {}

  // 应急仓库
  public static final String WAREHOUSE_CREATE = "应急仓库创建 name=%s actor=%s";
  public static final String WAREHOUSE_UPDATE = "应急仓库更新 id=%d actor=%s";
  public static final String WAREHOUSE_STATUS = "应急仓库状态变更 id=%d status=%s actor=%s";
  public static final String WAREHOUSE_EXPORT = "应急仓库导出 actor=%s";

  // 应急物资
  public static final String SUPPLY_CREATE = "应急物资创建 sku=%s actor=%s";
  public static final String SUPPLY_UPDATE = "应急物资更新 id=%d actor=%s";
  public static final String SUPPLY_SAFETY = "应急物资安全库存变更 id=%d safetyStock=%d actor=%s";
  public static final String SUPPLY_EXPORT = "应急物资导出 actor=%s";

  // 库存批次
  public static final String BATCH_INBOUND = "库存批次入库 batchNo=%s qty=%d quality=%s actor=%s";
  public static final String BATCH_QUALITY = "库存批次质检 batchId=%d quality=%s actor=%s";
  public static final String BATCH_EXPIRE_WARN = "临期预警 batchNo=%s expireAt=%s";
  public static final String BATCH_FROZEN = "批次冻结不计入调拨 batchNo=%s reason=%s";

  // 避难安置点
  public static final String SHELTER_CREATE = "避难安置点创建 name=%s actor=%s";
  public static final String SHELTER_UPDATE = "避难安置点更新 id=%d actor=%s";
  public static final String SHELTER_STATUS = "避难安置点开放状态变更 id=%d status=%s actor=%s";
  public static final String SHELTER_EXPORT = "避难安置点导出 actor=%s";

  // 调拨单
  public static final String DISPATCH_CREATE = "调拨单创建 id=%d priority=%s lines=%d actor=%s";
  public static final String DISPATCH_RELEASE = "调拨放行 orderId=%d approver=%s reason=%s";
  public static final String DISPATCH_EMERGENCY_RELEASE = "应急调拨放行 orderId=%d approver=%s reason=%s";
  public static final String DISPATCH_SAFETY_REJECT = "安全库存拦截整单拒绝 orderId=%d itemId=%d remain=%d safety=%d";
  public static final String DISPATCH_REJECT = "调拨驳回 orderId=%d approver=%s reason=%s";
  public static final String DISPATCH_CONCURRENT_FAIL = "并发申领冲突 orderId=%d batchId=%d";
}
