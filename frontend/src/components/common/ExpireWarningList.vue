<script setup lang="ts">
import type { InventoryBatch } from "../../types/InventoryBatch";
import { daysUntil, formatDate } from "../../utils/formatters";
import EmptyState from "./EmptyState.vue";

defineProps<{ batches: InventoryBatch[]; title?: string }>();
</script>

<template>
  <div class="panel">
    <h2>{{ title ?? "临期预警" }}</h2>
    <EmptyState v-if="batches.length === 0" text="暂无临期批次" />
    <article v-for="batch in batches" :key="batch.id" class="warn-row">
      <div>
        <strong>{{ batch.item_name }}</strong>
        <span class="mono muted"> {{ batch.batch_no }}</span>
        <div class="muted">{{ batch.warehouse_name }} · {{ formatDate(batch.expire_at) }} 到期</div>
      </div>
      <span class="days-left" :class="{ urgent: daysUntil(batch.expire_at) <= 7 }">
        剩 {{ daysUntil(batch.expire_at) }} 天
      </span>
    </article>
  </div>
</template>
