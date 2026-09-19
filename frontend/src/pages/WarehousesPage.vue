<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useInventoryBatchStore } from "../stores/InventoryBatchStore";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useSupplyItemStore } from "../stores/SupplyItemStore";
import { createInboundForm } from "../constructors/InventoryBatchConstructor";
import { currentUser } from "../utils/currentUser";
import { formatDate, formatNumber } from "../utils/formatters";
import { BatchBucket, BatchBucketText } from "../constants/BatchBucket";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import BatchTable from "../components/common/BatchTable.vue";
import EmptyState from "../components/common/EmptyState.vue";
import type { InventoryBatch } from "../types/InventoryBatch";

const store = useInventoryBatchStore();
const warehouseStore = useWarehouseStore();
const supplyItemStore = useSupplyItemStore();

const warehouseId = ref<number | undefined>(undefined);
const bucketFilter = ref<string>("");
const showInbound = ref(false);
const inboundForm = ref(createInboundForm());
const actionError = ref("");

const canOperate = computed(() => ["WAREHOUSE_KEEPER", "ADMIN"].includes(currentUser.role));

const filteredBatches = computed(() =>
  bucketFilter.value ? store.batches.filter((batch) => batch.bucket === bucketFilter.value) : store.batches
);

const bucketOptions = [
  { value: "", label: "全部" },
  ...BatchBucket.map((bucket) => ({ value: bucket as string, label: BatchBucketText[bucket] }))
];

async function reload() {
  await Promise.all([warehouseStore.load(), supplyItemStore.load()]);
  await store.load(warehouseId.value);
}

async function changeWarehouse() {
  await store.load(warehouseId.value);
}

async function submitInbound() {
  actionError.value = "";
  const form = inboundForm.value;
  if (!form.warehouseId || !form.supplyItemId || !form.batchNo || !form.expireAt || form.quantity <= 0) {
    actionError.value = "请完整填写入库信息";
    return;
  }
  try {
    await store.inbound(
      {
        warehouseId: form.warehouseId,
        supplyItemId: form.supplyItemId,
        batchNo: form.batchNo,
        quantity: form.quantity,
        expireAt: form.expireAt.replace("T", " "),
        inboundSource: form.inboundSource
      },
      warehouseId.value
    );
    showInbound.value = false;
    inboundForm.value = createInboundForm();
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : "入库失败";
  }
}

async function qualify(batch: InventoryBatch) {
  actionError.value = "";
  try {
    await store.markQuality(batch.id, "QUALIFIED", warehouseId.value);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : "质检失败";
  }
}

onMounted(reload);
</script>

<template>
  <section class="page-body">
    <div class="toolbar">
      <label>
        仓库
        <select v-model="warehouseId" @change="changeWarehouse">
          <option :value="undefined">全部仓库</option>
          <option v-for="warehouse in warehouseStore.rows" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </option>
        </select>
      </label>
      <button class="primary ghost" @click="reload">刷新</button>
      <button v-if="canOperate" class="primary" @click="showInbound = !showInbound">
        {{ showInbound ? "取消入库" : "批次入库" }}
      </button>
    </div>

    <p v-if="actionError" class="error-banner">{{ actionError }}</p>

    <form v-if="showInbound && canOperate" class="panel inbound-form" @submit.prevent="submitInbound">
      <h2>批次入库（默认待检，质检合格后才可拨）</h2>
      <div class="form-grid">
        <label>仓库
          <select v-model.number="inboundForm.warehouseId" required>
            <option :value="null" disabled>选择仓库</option>
            <option v-for="warehouse in warehouseStore.rows" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label>物资
          <select v-model.number="inboundForm.supplyItemId" required>
            <option :value="null" disabled>选择物资</option>
            <option v-for="item in supplyItemStore.rows" :key="item.id" :value="item.id">
              {{ item.name }}（{{ item.unit }}）
            </option>
          </select>
        </label>
        <label>批次号 <input v-model.trim="inboundForm.batchNo" required placeholder="B2026-XXXX" /></label>
        <label>数量 <input v-model.number="inboundForm.quantity" type="number" min="1" required /></label>
        <label>到期时间 <input v-model="inboundForm.expireAt" type="datetime-local" required /></label>
        <label>来源 <input v-model.trim="inboundForm.inboundSource" /></label>
      </div>
      <button class="primary" type="submit">确认入库</button>
    </form>

    <section class="metrics four">
      <StatCard label="可用数量" :value="formatNumber(store.totals.available)" />
      <StatCard label="临期数量" :value="formatNumber(store.totals.nearExpiry)" />
      <StatCard label="冻结数量（待检/不合格/过期）" :value="formatNumber(store.totals.frozen)" />
      <StatCard label="可调拨量" :value="formatNumber(store.totals.dispatchable)" />
    </section>

    <div class="panel">
      <h2>库存汇总（按物资）</h2>
      <EmptyState v-if="store.summary.length === 0" />
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>物资</th><th>SKU</th><th>可用</th><th>临期</th><th>冻结</th>
            <th>可调拨</th><th>安全库存</th><th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in store.summary" :key="`${row.warehouse_id}-${row.supply_item_id}`">
            <td>{{ row.item_name }}</td>
            <td class="mono">{{ row.sku_code }}</td>
            <td>{{ formatNumber(row.available) }} {{ row.unit }}</td>
            <td>{{ formatNumber(row.near_expiry) }} {{ row.unit }}</td>
            <td>{{ formatNumber(row.frozen) }} {{ row.unit }}</td>
            <td><strong>{{ formatNumber(row.dispatchable) }}</strong> {{ row.unit }}</td>
            <td>{{ formatNumber(row.safety_stock) }} {{ row.unit }}</td>
            <td>
              <span v-if="row.below_safety" class="badge badge-bad">低于安全库存</span>
              <span v-else class="badge badge-ok">达标</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>批次明细</h2>
        <div class="bucket-filter">
          <button
            v-for="option in bucketOptions"
            :key="option.value"
            :class="{ active: bucketFilter === option.value }"
            @click="bucketFilter = option.value"
          >{{ option.label }}</button>
        </div>
      </div>
      <BatchTable :batches="filteredBatches" :show-quality-action="canOperate" @qualify="qualify" />
    </div>

    <div class="panel">
      <h2>最近放行记录</h2>
      <EmptyState v-if="store.releases.length === 0" text="暂无放行记录" />
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>调拨单</th><th>批次</th><th>物资</th><th>数量</th><th>优先级</th>
            <th>审批员</th><th>放行原因</th><th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in store.releases" :key="record.id">
            <td>#{{ record.dispatch_order_id }}</td>
            <td class="mono">{{ record.batch_no }}</td>
            <td>{{ record.item_name }}</td>
            <td>{{ record.quantity }}</td>
            <td><StatusBadge :value="record.priority" /></td>
            <td>{{ record.approved_by }}</td>
            <td>{{ record.reason || "—" }}</td>
            <td>{{ formatDate(record.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
