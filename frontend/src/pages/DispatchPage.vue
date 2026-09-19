<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useDispatchOrderStore } from "../stores/DispatchOrderStore";
import { useWarehouseStore } from "../stores/WarehouseStore";
import { useShelterStore } from "../stores/ShelterStore";
import { listInventoryBatch } from "../api/InventoryBatch";
import { useDispatchFlow } from "../hooks/useDispatchFlow";
import { createDispatchForm } from "../constructors/DispatchOrderConstructor";
import { currentUser } from "../utils/currentUser";
import { formatDate } from "../utils/formatters";
import { DispatchPriority, DispatchPriorityText } from "../constants/DispatchPriority";
import { ERROR_CODES } from "../constants/errorCodes";
import StatusBadge from "../components/common/StatusBadge.vue";
import ApprovalTimeline from "../components/common/ApprovalTimeline.vue";
import EmptyState from "../components/common/EmptyState.vue";
import type { DispatchOrder } from "../types/DispatchOrder";
import type { InventoryBatch } from "../types/InventoryBatch";

const store = useDispatchOrderStore();
const warehouseStore = useWarehouseStore();
const shelterStore = useShelterStore();
const { submitting, lastError, lastErrorCode, create, approve, reject } = useDispatchFlow();

const form = ref(createDispatchForm());
const dispatchableBatches = ref<InventoryBatch[]>([]);
const createError = ref("");
const approveTarget = ref<DispatchOrder | null>(null);
const rejectTarget = ref<DispatchOrder | null>(null);
const reasonInput = ref("");
const detailTarget = ref<DispatchOrder | null>(null);

const canApprove = computed(() => ["APPROVER", "ADMIN"].includes(currentUser.role));
const canCreate = computed(() => currentUser.role !== "VIEWER");

async function loadBatches() {
  if (!form.value.sourceWarehouseId) {
    dispatchableBatches.value = [];
    return;
  }
  const batches = await listInventoryBatch(form.value.sourceWarehouseId);
  // 冻结批次（待检/不合格/已过期）不进入可选批次
  dispatchableBatches.value = batches.filter((batch) => batch.dispatchable);
}

watch(() => form.value.sourceWarehouseId, async () => {
  form.value.lines = [{ batchId: null, quantity: 1 }];
  await loadBatches();
});

function addLine() {
  form.value.lines.push({ batchId: null, quantity: 1 });
}

function removeLine(index: number) {
  form.value.lines.splice(index, 1);
}

async function submitCreate() {
  createError.value = "";
  const value = form.value;
  if (!value.sourceWarehouseId || !value.shelterId) {
    createError.value = "请选择来源仓库与安置点";
    return;
  }
  if (value.lines.some((line) => !line.batchId || line.quantity <= 0)) {
    createError.value = "请完整填写调拨明细";
    return;
  }
  const ok = await create({
    sourceWarehouseId: value.sourceWarehouseId,
    shelterId: value.shelterId,
    priority: value.priority,
    lines: value.lines.map((line) => ({ batchId: line.batchId as number, quantity: line.quantity }))
  });
  if (ok) {
    form.value = createDispatchForm();
    dispatchableBatches.value = [];
  } else {
    createError.value = lastError.value;
  }
}

function openApprove(order: DispatchOrder) {
  approveTarget.value = order;
  reasonInput.value = "";
  lastError.value = "";
  lastErrorCode.value = "";
}

function openReject(order: DispatchOrder) {
  rejectTarget.value = order;
  reasonInput.value = "";
  lastError.value = "";
  lastErrorCode.value = "";
}

async function confirmApprove() {
  if (!approveTarget.value) return;
  const ok = await approve(approveTarget.value.id, reasonInput.value.trim());
  if (ok) {
    approveTarget.value = null;
    // 安全库存整单拒绝会以 409 返回并被拦截提示
  }
}

async function confirmReject() {
  if (!rejectTarget.value) return;
  const ok = await reject(rejectTarget.value.id, reasonInput.value.trim());
  if (ok) rejectTarget.value = null;
}

onMounted(async () => {
  await Promise.all([store.load(), warehouseStore.load(), shelterStore.load()]);
});
</script>

<template>
  <section class="page-body">
    <div v-if="canCreate" class="panel">
      <h2>创建调拨单</h2>
      <div class="form-grid">
        <label>来源仓库
          <select v-model.number="form.sourceWarehouseId">
            <option :value="null" disabled>选择仓库</option>
            <option v-for="warehouse in warehouseStore.rows" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label>接收安置点
          <select v-model.number="form.shelterId">
            <option :value="null" disabled>选择安置点</option>
            <option v-for="shelter in shelterStore.rows" :key="shelter.id" :value="shelter.id">
              {{ shelter.name }}
            </option>
          </select>
        </label>
        <label>优先级
          <select v-model="form.priority">
            <option v-for="priority in DispatchPriority" :key="priority" :value="priority">
              {{ DispatchPriorityText[priority] }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="form.sourceWarehouseId" class="lines">
        <p class="muted">仅可选择可调拨批次（合格且未过期），冻结批次已被排除。</p>
        <div v-for="(line, index) in form.lines" :key="index" class="line-row">
          <select v-model.number="line.batchId">
            <option :value="null" disabled>选择批次</option>
            <option v-for="batch in dispatchableBatches" :key="batch.id" :value="batch.id">
              {{ batch.batch_no }} · {{ batch.item_name }} · 可拨 {{ batch.quantity }} {{ batch.unit }}
              <template v-if="batch.bucket === 'NEAR_EXPIRY'">（临期）</template>
            </option>
          </select>
          <input v-model.number="line.quantity" type="number" min="1" placeholder="数量" />
          <button class="link-btn" type="button" @click="removeLine(index)">移除</button>
        </div>
        <button class="primary ghost" type="button" @click="addLine">添加明细行</button>
      </div>

      <p v-if="createError" class="error-banner">{{ createError }}</p>
      <button class="primary" :disabled="submitting" @click="submitCreate">提交调拨单</button>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>调拨单列表</h2>
        <button class="primary ghost" @click="store.load()">刷新</button>
      </div>
      <EmptyState v-if="store.rows.length === 0" />
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>单号</th><th>来源仓库</th><th>安置点</th><th>优先级</th><th>明细</th>
            <th>状态</th><th>申请人</th><th>时间</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in store.rows" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ order.warehouse_name }}</td>
            <td>{{ order.shelter_name }}</td>
            <td><StatusBadge :value="order.priority" /></td>
            <td>
              <div v-for="line in order.lines" :key="line.id" class="muted">
                {{ line.item_name }} × {{ line.quantity }}
              </div>
            </td>
            <td><StatusBadge :value="order.status" /></td>
            <td>{{ order.requested_by }}</td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td class="actions">
              <button class="link-btn" @click="detailTarget = order">详情</button>
              <template v-if="order.status === 'SUBMITTED' && canApprove">
                <button class="link-btn" @click="openApprove(order)">放行</button>
                <button class="link-btn danger" @click="openReject(order)">驳回</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="approveTarget" class="dialog-mask" @click.self="approveTarget = null">
      <div class="dialog">
        <h2>放行调拨单 #{{ approveTarget.id }}</h2>
        <p v-if="approveTarget.priority === 'EMERGENCY'" class="warn-text">
          应急调拨：可突破安全库存，但必须填写放行原因。
        </p>
        <p v-else class="muted">普通调拨：若拨后低于安全库存将整单拒绝。</p>
        <textarea
          v-model="reasonInput"
          rows="3"
          :placeholder="approveTarget.priority === 'EMERGENCY' ? '必填：应急放行原因' : '选填：放行备注'"
        />
        <p v-if="lastError" class="error-banner">
          {{ lastError }}
          <template v-if="lastErrorCode === ERROR_CODES.CONCURRENT_CLAIM_FAILED">
            （库存未被改动，可刷新后重试）
          </template>
        </p>
        <div class="dialog-actions">
          <button class="primary ghost" @click="approveTarget = null">取消</button>
          <button class="primary" :disabled="submitting" @click="confirmApprove">确认放行</button>
        </div>
      </div>
    </div>

    <div v-if="rejectTarget" class="dialog-mask" @click.self="rejectTarget = null">
      <div class="dialog">
        <h2>驳回调拨单 #{{ rejectTarget.id }}</h2>
        <textarea v-model="reasonInput" rows="3" placeholder="必填：驳回原因" />
        <p v-if="lastError" class="error-banner">{{ lastError }}</p>
        <div class="dialog-actions">
          <button class="primary ghost" @click="rejectTarget = null">取消</button>
          <button class="primary danger" :disabled="submitting" @click="confirmReject">确认驳回</button>
        </div>
      </div>
    </div>

    <div v-if="detailTarget" class="dialog-mask" @click.self="detailTarget = null">
      <div class="dialog">
        <h2>调拨单 #{{ detailTarget.id }} 审批轨迹</h2>
        <ApprovalTimeline :order="detailTarget" />
        <div class="dialog-actions">
          <button class="primary ghost" @click="detailTarget = null">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>
