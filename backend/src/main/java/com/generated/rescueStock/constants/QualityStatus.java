package com.generated.rescueStock.constants;

/** 质检状态：待检 / 合格 / 不合格。待检与不合格一律冻结，不得进入可调拨量。 */
public enum QualityStatus { PENDING_QC, QUALIFIED, UNQUALIFIED }
