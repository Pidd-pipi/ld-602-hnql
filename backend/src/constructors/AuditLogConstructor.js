/** 审计日志构造器：所有写操作（含被拒绝的调拨尝试）留痕。 */
export function createAuditEntry({ id, actor, action, target_type, target_id, detail, created_at }) {
  return { id, actor, action, target_type, target_id, detail, created_at };
}
