<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useInventoryBatchStore } from "../stores/InventoryBatchStore";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useExpireWarning } from "../hooks/useExpireWarning";
import { formatNumber } from "../utils/formatters";
import StatCard from "../components/common/StatCard.vue";
import ExpireWarningList from "../components/common/ExpireWarningList.vue";
import StatusBadge from "../components/common/StatusBadge.vue";

const batchStore = useInventoryBatchStore();
const dispatchStore = useDispatchOrderStore();
const warehouseStore = useWarehouseStore();
const batchesRef = computed(() => batchStore.batches);
const { nearExpiryBatches } = useExpireWarning(batchesRef);

const pendingDispatches = computed(() => dispatchStore.rows.filter((row) => row.status === "SUBMITTED"));

onMounted(async () => {
  await Promise.all([batchStore.load(), dispatchStore.load(), warehouseStore.load()]);
});
</script>

<template>
  <section class="page-body">
    <section class="metrics four">
      <StatCard label="应急仓库" :value="warehouseStore.rows.length" />
      <StatCard label="可调拨总量" :value="formatNumber(batchStore.totals.dispatchable)" />
      <StatCard label="临期批次" :value="nearExpiryBatches.length" />
      <StatCard label="待审批调拨" :value="pendingDispatches.length" />
    </section>

    <div class="workbench">
      <ExpireWarningList :batches="nearExpiryBatches" title="临期物资预警" />
      <div class="panel">
        <h2>待审批调拨</h2>
        <p v-if="pendingDispatches.length === 0" class="muted">暂无待审批调拨单</p>
        <article v-for="order in pendingDispatches" :key="order.id" class="row">
          <strong>#{{ order.id }} {{ order.warehouse_name }} → {{ order.shelter_name }}</strong>
          <StatusBadge :value="order.priority" />
          <StatusBadge :value="order.status" />
        </article>
      </div>
    </div>
  </section>
</template>
