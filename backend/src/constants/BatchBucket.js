/**
 * 批次分区（派生状态，不落库）：
 * - AVAILABLE  可用：质检合格、未过期、未进入临期窗口
 * - NEAR_EXPIRY 临期：质检合格、未过期、距到期 ≤ 阈值（仍可调拨）
 * - FROZEN     冻结：待检 / 不合格 / 已过期（不进入可调拨量）
 */
export const BatchBucket = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  NEAR_EXPIRY: 'NEAR_EXPIRY',
  FROZEN: 'FROZEN',
});

export const BATCH_BUCKET_TEXT = Object.freeze({
  AVAILABLE: '可用',
  NEAR_EXPIRY: '临期',
  FROZEN: '冻结',
});
