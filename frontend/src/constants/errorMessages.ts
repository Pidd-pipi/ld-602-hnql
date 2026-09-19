export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  INTERNAL_ERROR: "系统繁忙，请稍后再试",
  BATCH_NOT_FOUND: "库存批次不存在",
  BATCH_NOT_DISPATCHABLE: "批次待检、不合格或已过期，已冻结不可调拨",
  INSUFFICIENT_STOCK: "批次可调拨数量不足",
  SAFETY_STOCK_BREACH: "调拨后将低于安全库存，普通调拨整单拒绝",
  CONCURRENT_CLAIM_FAILED: "该批次已被其他调拨单锁定，本次申领失败且库存未变更",
  DISPATCH_NOT_FOUND: "调拨单不存在",
  DISPATCH_NOT_ACTIONABLE: "调拨单当前状态不可执行该操作",
  REASON_REQUIRED: "应急调拨或驳回必须由审批员填写原因"
};
