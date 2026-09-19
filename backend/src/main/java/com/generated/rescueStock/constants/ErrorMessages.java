package com.generated.rescueStock.constants;

public final class ErrorMessages {
  private ErrorMessages() {}
  public static final String AUTH_REQUIRED = "请先登录后再继续操作";
  public static final String RBAC_DENIED = "当前角色没有执行该动作的权限";
  public static final String VALIDATION_FAILED = "表单字段缺失或格式错误";
  public static final String RATE_LIMITED = "请求过于频繁，请稍后再试";
  public static final String INTERNAL_ERROR = "系统繁忙，请稍后再试";
  public static final String BATCH_NOT_FOUND = "库存批次不存在";
  public static final String BATCH_NOT_DISPATCHABLE = "批次待检、不合格或已过期，已冻结不可调拨";
  public static final String INSUFFICIENT_STOCK = "批次可调拨数量不足";
  public static final String SAFETY_STOCK_BREACH = "调拨后将低于安全库存，普通调拨整单拒绝";
  public static final String CONCURRENT_CLAIM_FAILED = "该批次已被其他调拨单锁定，本次申领失败且库存未变更";
  public static final String DISPATCH_NOT_FOUND = "调拨单不存在";
  public static final String DISPATCH_NOT_ACTIONABLE = "调拨单当前状态不可执行该操作";
  public static final String REASON_REQUIRED = "应急调拨或驳回必须由审批员填写原因";
}
