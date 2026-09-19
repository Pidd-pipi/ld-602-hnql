import { computed, type ComputedRef, type Ref } from "vue";
import type { InventoryBatch } from "../types/InventoryBatch";
import { daysUntil } from "../utils/formatters";

/** 临期预警：从批次列表提取临期（NEAR_EXPIRY）批次，按剩余天数升序。 */
export function useExpireWarning(batches: Readonly<Ref<InventoryBatch[]>>) {
  const nearExpiryBatches: ComputedRef<InventoryBatch[]> = computed(() =>
    batches.value
      .filter((batch) => batch.bucket === "NEAR_EXPIRY")
      .slice()
      .sort((a, b) => daysUntil(a.expire_at) - daysUntil(b.expire_at))
  );
  const frozenBatches = computed(() => batches.value.filter((batch) => batch.bucket === "FROZEN"));
  const warningCount = computed(() => nearExpiryBatches.value.length);
  return { nearExpiryBatches, frozenBatches, warningCount };
}
