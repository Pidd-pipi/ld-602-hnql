export const BatchBucket = ["AVAILABLE", "NEAR_EXPIRY", "FROZEN"] as const;
export type BatchBucket = (typeof BatchBucket)[number];
export const BatchBucketText: Record<BatchBucket, string> = {
  AVAILABLE: "可用",
  NEAR_EXPIRY: "临期",
  FROZEN: "冻结"
};
