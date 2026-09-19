/** 日志模板：所有写操作经 audit_log 落库，同时按模板输出控制台日志。 */
export const LOG_TEMPLATES = Object.freeze({
  BATCH_INBOUND: '批次入库 batch=%s qty=%s quality=%s',
  DISPATCH_CLAIMED: '普通调拨放行 order=%s lines=%s',
  DISPATCH_SUBMITTED: '应急调拨提交 order=%s 待审批',
  DISPATCH_RELEASED: '应急调拨放行 order=%s approver=%s',
  DISPATCH_REJECTED: '调拨拒绝 reason=%s',
});

export function formatLog(template, ...args) {
  return template.replace(/%s/g, () => String(args.shift()));
}
