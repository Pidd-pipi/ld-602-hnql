export const QualityStatus = ["PENDING_QC", "QUALIFIED", "UNQUALIFIED"] as const;
export type QualityStatus = (typeof QualityStatus)[number];
export const QualityStatusText: Record<QualityStatus, string> = {
  PENDING_QC: "待检",
  QUALIFIED: "合格",
  UNQUALIFIED: "不合格"
};
