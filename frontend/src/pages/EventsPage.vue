<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { formatDate } from "../utils/formatters";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";

const store = useDispatchOrderStore();
const emergencyOrders = computed(() => store.rows.filter((row) => row.priority === "EMERGENCY"));

onMounted(store.load);
</script>

<template>
  <section class="page-body">
    <div class="panel">
      <h2>应急调拨响应</h2>
      <p class="muted">应急调拨由审批员填写原因后放行，可突破安全库存约束。</p>
      <EmptyState v-if="emergencyOrders.length === 0" text="暂无应急调拨" />
      <table v-else class="data-table">
        <thead>
          <tr><th>单号</th><th>来源仓库</th><th>安置点</th><th>状态</th><th>审批员</th><th>原因</th><th>时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="order in emergencyOrders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ order.warehouse_name }}</td>
            <td>{{ order.shelter_name }}</td>
            <td><StatusBadge :value="order.status" /></td>
            <td>{{ order.approved_by || "—" }}</td>
            <td>{{ order.approve_reason || order.reject_reason || "—" }}</td>
            <td>{{ formatDate(order.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
