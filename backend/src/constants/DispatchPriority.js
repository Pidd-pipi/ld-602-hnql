/** 调拨类型：普通调拨受安全库存约束；应急调拨需审批员填写原因后放行。 */
export const DispatchPriority = Object.freeze({
  NORMAL: 'NORMAL',
  EMERGENCY: 'EMERGENCY',
});

export const DISPATCH_PRIORITY_TEXT = Object.freeze({
  NORMAL: '普通调拨',
  EMERGENCY: '应急调拨',
});
