<script setup lang="ts">
import type { DispatchOrder } from "../../types/DispatchOrder";
import { formatDate } from "../../utils/formatters";
import StatusBadge from "./StatusBadge.vue";

defineProps<{ order: DispatchOrder }>();
</script>

<template>
  <ol class="timeline">
    <li>
      <span class="dot done" />
      <div>
        <strong>提交调拨</strong>
        <p class="muted">{{ order.requested_by }} · {{ formatDate(order.created_at) }}</p>
      </div>
    </li>
    <li v-if="order.status !== 'SUBMITTED'">
      <span class="dot" :class="order.status === 'REJECTED' ? 'bad' : 'done'" />
      <div>
        <strong>{{ order.status === "REJECTED" ? "审批驳回" : "审批放行" }}</strong>
        <p class="muted">
          {{ order.approved_by }} · {{ order.approve_reason || order.reject_reason || "—" }}
        </p>
      </div>
    </li>
    <li v-if="order.status === 'DISPATCHED'">
      <span class="dot done" />
      <div>
        <strong>出库完成</strong>
        <p class="muted">{{ formatDate(order.dispatched_at) }}</p>
      </div>
    </li>
    <li class="current">
      <StatusBadge :value="order.status" />
      <StatusBadge :value="order.priority" />
    </li>
  </ol>
</template>
