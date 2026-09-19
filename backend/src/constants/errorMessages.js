/** 错误消息模板：与 errorCodes 一一对应，service 抛出、controller 透传。 */
export const ERROR_MESSAGES = Object.freeze({
  VALIDATION_ERROR: (field) => `字段 ${field} 不合法`,
  NOT_FOUND: (what) => `${what} 不存在`,
  FORBIDDEN: () => '当前角色无权执行该操作',
  BATCH_NOT_TRANSFERABLE: (batchNo) =>
    `批次 ${batchNo} 为待检/不合格/已过期状态，不计入可调拨量`,
  INSUFFICIENT_STOCK: (batchNo) => `批次 ${batchNo} 可调拨数量不足`,
  SAFETY_STOCK_VIOLATION: (itemName) =>
    `调拨后物资「${itemName}」可调拨量将低于安全库存，整单拒绝`,
  RELEASE_REASON_REQUIRED: () => '应急调拨放行必须由审批员填写原因',
  ORDER_STATE_INVALID: (status) => `调拨单当前状态为 ${status}，不允许该操作`,
  INTERNAL_ERROR: () => '服务器内部错误',
});

export function errorMessage(code, ...args) {
  const tpl = ERROR_MESSAGES[code];
  return typeof tpl === 'function' ? tpl(...args) : String(code);
}
