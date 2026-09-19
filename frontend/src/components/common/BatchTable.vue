<script setup lang="ts">
import type { InventoryBatch } from "../../types/InventoryBatch";
import { formatDate, daysUntil } from "../../utils/formatters";
import StatusBadge from "./StatusBadge.vue";
import EmptyState from "./EmptyState.vue";

defineProps<{ batches: InventoryBatch[]; showQualityAction?: boolean }>();
const emit = defineEmits<{ (e: "qualify", batch: InventoryBatch): void }>();
</script>

<template>
  <EmptyState v-if="batches.length === 0" />
  <table v-else class="data-table">
    <thead>
      <tr>
        <th>批次号</th><th>物资</th><th>数量</th><th>到期日</th><th>剩余</th>
        <th>质检</th><th>三态</th><th>来源</th><th v-if="showQualityAction">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="batch in batches" :key="batch.id">
        <td class="mono">{{ batch.batch_no }}</td>
        <td>{{ batch.item_name }}</td>
        <td>{{ batch.quantity }} {{ batch.unit }}</td>
        <td>{{ formatDate(batch.expire_at) }}</td>
        <td>
          <span v-if="batch.bucket !== 'FROZEN'">{{ daysUntil(batch.expire_at) }} 天</span>
          <span v-else>—</span>
        </td>
        <td><StatusBadge :value="batch.quality_status" /></td>
        <td><StatusBadge :value="batch.bucket" /></td>
        <td>{{ batch.inbound_source }}</td>
        <td v-if="showQualityAction">
          <button
            v-if="batch.quality_status === 'PENDING_QC'"
            class="link-btn"
            @click="emit('qualify', batch)"
          >质检合格</button>
          <span v-else>—</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
