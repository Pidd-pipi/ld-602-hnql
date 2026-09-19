<script setup lang="ts">
import { computed } from "vue";
import { STATUS_TEXT } from "../../constants/statusText";

const props = defineProps<{ value: string }>();

const textMap: Record<string, string> = {
  ...STATUS_TEXT.BatchBucket,
  ...STATUS_TEXT.QualityStatus,
  ...STATUS_TEXT.DispatchStatus,
  ...STATUS_TEXT.DispatchPriority,
  ...STATUS_TEXT.ShelterStatus,
  ...STATUS_TEXT.SupplyCategory
};

const label = computed(() => textMap[props.value] ?? props.value.replace(/_/g, " "));

const tone = computed(() => {
  if (["AVAILABLE", "QUALIFIED", "DISPATCHED", "RECEIVED", "APPROVED", "OPEN", "ACTIVE"].includes(props.value)) return "ok";
  if (["NEAR_EXPIRY", "PENDING_QC", "SUBMITTED", "STANDBY", "DRAFT"].includes(props.value)) return "warn";
  if (["FROZEN", "UNQUALIFIED", "REJECTED", "CLOSED", "EMERGENCY"].includes(props.value)) return "bad";
  return "plain";
});
</script>

<template>
  <span class="badge" :class="`badge-${tone}`">{{ label }}</span>
</template>
