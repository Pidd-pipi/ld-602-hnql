/** 调拨单状态：待审批 / 已放行 / 已拒绝。 */
export const DispatchStatus = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  RELEASED: 'RELEASED',
  REJECTED: 'REJECTED',
});

export const DISPATCH_STATUS_TEXT = Object.freeze({
  SUBMITTED: '待审批',
  RELEASED: '已放行',
  REJECTED: '已拒绝',
});
