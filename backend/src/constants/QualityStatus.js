/** 质检状态：待检 / 合格 / 不合格。待检与不合格一律冻结，不进入可调拨量。 */
export const QualityStatus = Object.freeze({
  PENDING_QC: 'PENDING_QC',
  PASSED: 'PASSED',
  REJECTED: 'REJECTED',
});

export const QUALITY_STATUS_TEXT = Object.freeze({
  PENDING_QC: '待检',
  PASSED: '合格',
  REJECTED: '不合格',
});

export const QUALITY_STATUS_VALUES = Object.freeze(Object.values(QualityStatus));
