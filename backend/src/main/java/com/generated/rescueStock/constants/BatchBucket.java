package com.generated.rescueStock.constants;

import java.time.LocalDateTime;

/**
 * 批次三态（库存页展示口径）：
 * AVAILABLE  可用   —— 合格且效期充裕
 * NEAR_EXPIRY 临期  —— 合格但距到期不足 nearExpireDays 天
 * FROZEN     冻结   —— 待检、不合格或已过期，不得进入可调拨量
 */
public enum BatchBucket {
  AVAILABLE, NEAR_EXPIRY, FROZEN;

  public static BatchBucket of(String qualityStatus, LocalDateTime expireAt, LocalDateTime now, int nearExpireDays) {
    if (!QualityStatus.QUALIFIED.name().equals(qualityStatus)) return FROZEN;
    if (expireAt == null || !expireAt.isAfter(now)) return FROZEN;
    if (!expireAt.isAfter(now.plusDays(nearExpireDays))) return NEAR_EXPIRY;
    return AVAILABLE;
  }

  /** 可调拨 = 合格且未过期（可用 + 临期） */
  public static boolean dispatchable(String qualityStatus, LocalDateTime expireAt, LocalDateTime now) {
    return QualityStatus.QUALIFIED.name().equals(qualityStatus) && expireAt != null && expireAt.isAfter(now);
  }
}
