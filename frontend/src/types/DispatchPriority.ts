export const DispatchPriority = ["NORMAL", "EMERGENCY"] as const;
export type DispatchPriority = (typeof DispatchPriority)[number];
export const DispatchPriorityText: Record<DispatchPriority, string> = {
  NORMAL: "普通调拨",
  EMERGENCY: "应急调拨"
};
