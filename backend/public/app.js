const state = {
  meta: null,
  warehouseId: '',
  inventory: null,
  releases: [],
  orders: [],
};

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '—');

function role() {
  return $('#roleSelect').value;
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', 'x-role': role() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error || {};
    throw new Error(`${err.code || res.status}: ${err.message || res.statusText}`);
  }
  return data;
}

function toast(message, kind = 'info') {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast ${kind}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 4200);
}

const BUCKET_CLASS = { AVAILABLE: 'ok', NEAR_EXPIRY: 'warn', FROZEN: 'frozen' };

function renderSummary() {
  const warehouses = state.inventory?.warehouses || [];
  const totals = warehouses.reduce(
    (acc, w) => ({
      available_qty: acc.available_qty + w.totals.available_qty,
      near_expiry_qty: acc.near_expiry_qty + w.totals.near_expiry_qty,
      frozen_qty: acc.frozen_qty + w.totals.frozen_qty,
      transferable_qty: acc.transferable_qty + w.totals.transferable_qty,
    }),
    { available_qty: 0, near_expiry_qty: 0, frozen_qty: 0, transferable_qty: 0 },
  );
  const cards = [
    ['可用数量', totals.available_qty, 'ok'],
    ['临期数量', totals.near_expiry_qty, 'warn'],
    ['冻结数量（待检/不合格/已过期）', totals.frozen_qty, 'frozen'],
    ['可调拨量（可用+临期）', totals.transferable_qty, 'info'],
  ];
  $('#summaryCards').innerHTML = cards
    .map(([label, value, cls]) => `<div class="card ${cls}"><div class="card-value">${value}</div><div class="card-label">${label}</div></div>`)
    .join('');
}

function renderInventory() {
  const bucketText = state.meta?.batch_bucket_text || {};
  const qualityText = state.meta?.quality_status_text || {};
  const warehouses = state.inventory?.warehouses || [];
  $('#inventoryTables').innerHTML = warehouses
    .map((w) => {
      const rows = w.items
        .map(
          (item) => `
        <tr class="${item.below_safety ? 'below-safety' : ''}">
          <td>${esc(item.name)}<div class="muted">${esc(item.sku_code)}</div></td>
          <td>${item.safety_stock} ${esc(item.unit)}</td>
          <td class="num ok">${item.available_qty}</td>
          <td class="num warn">${item.near_expiry_qty}</td>
          <td class="num frozen">${item.frozen_qty}</td>
          <td class="num"><strong>${item.transferable_qty}</strong></td>
          <td>${item.below_safety ? '<span class="badge danger">低于安全库存</span>' : '<span class="badge ok">正常</span>'}</td>
        </tr>
        <tr class="batch-row"><td></td><td colspan="6">
          <table class="batch-table">
            <thead><tr><th>批次号</th><th>数量</th><th>到期日</th><th>剩余天数</th><th>质检状态</th><th>分区</th><th>可调拨</th></tr></thead>
            <tbody>
              ${item.batches
                .map(
                  (b) => `<tr>
                <td>${esc(b.batch_no)}</td>
                <td class="num">${b.quantity}</td>
                <td>${esc((b.expire_at || '').slice(0, 10))}</td>
                <td class="num">${b.days_to_expire ?? '—'}</td>
                <td>${esc(qualityText[b.quality_status] || b.quality_status)}</td>
                <td><span class="badge ${BUCKET_CLASS[b.bucket]}">${esc(bucketText[b.bucket] || b.bucket)}</span></td>
                <td>${b.transferable ? '是' : '否'}</td>
              </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </td></tr>`,
        )
        .join('');
      return `
        <h3 class="warehouse-title">${esc(w.warehouse_name)} <span class="muted">${esc(w.district || '')}</span></h3>
        <table class="inventory-table">
          <thead><tr><th>物资</th><th>安全库存</th><th>可用</th><th>临期</th><th>冻结</th><th>可调拨量</th><th>状态</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7" class="muted">该仓库暂无库存批次</td></tr>'}</tbody>
        </table>`;
    })
    .join('');
}

function renderReleases() {
  const priorityText = state.meta?.dispatch_priority_text || {};
  const tbody = $('#releaseTable tbody');
  tbody.innerHTML = state.releases
    .map(
      (r) => `<tr>
      <td>${fmtTime(r.released_at)}</td>
      <td>#${r.order_id}</td>
      <td><span class="badge ${r.priority === 'EMERGENCY' ? 'warn' : 'info'}">${esc(priorityText[r.priority] || r.priority)}</span></td>
      <td>${esc(r.item_name || r.supply_item_id)}</td>
      <td>${esc(r.batch_no)}</td>
      <td class="num">${r.quantity} ${esc(r.unit || '')}</td>
      <td>${esc(r.actor)}</td>
      <td>${esc(r.reason)}</td>
    </tr>`,
    )
    .join('');
  $('#releaseEmpty').classList.toggle('hidden', state.releases.length > 0);
}

function renderPending() {
  const warehouses = new Map((state.meta?.warehouses || []).map((w) => [w.id, w.name]));
  const batches = new Map();
  for (const w of state.inventory?.warehouses || []) {
    for (const item of w.items) for (const b of item.batches) batches.set(b.id, b.batch_no);
  }
  const pending = state.orders.filter((o) => o.status === 'SUBMITTED');
  $('#pendingTable tbody').innerHTML = pending
    .map(
      (o) => `<tr>
      <td>#${o.id}</td>
      <td>${esc(warehouses.get(o.warehouse_id) || o.warehouse_id)}</td>
      <td>${esc(o.requested_by)}</td>
      <td>${o.lines.map((l) => `${esc(batches.get(l.batch_id) || `批次${l.batch_id}`)} × ${l.quantity}`).join('；')}</td>
      <td>${fmtTime(o.created_at)}</td>
      <td><button class="warn" data-release="${o.id}">审批放行</button></td>
    </tr>`,
    )
    .join('');
  $('#pendingEmpty').classList.toggle('hidden', pending.length > 0);
}

function fillSelect(select, rows, { value = 'id', label = 'name' }) {
  select.innerHTML = rows.map((r) => `<option value="${r[value]}">${esc(r[label])}</option>`).join('');
}

function renderFormOptions() {
  const { warehouses = [], supply_items = [], shelters = [] } = state.meta || {};
  document.querySelectorAll('select[name="warehouse_id"]').forEach((s) => fillSelect(s, warehouses));
  document.querySelectorAll('select[name="supply_item_id"]').forEach((s) => fillSelect(s, supply_items));
  document.querySelectorAll('select[name="shelter_id"]').forEach((s) => fillSelect(s, shelters));
  const transferable = [];
  for (const w of state.inventory?.warehouses || []) {
    for (const item of w.items) {
      for (const b of item.batches) {
        if (b.transferable && b.quantity > 0) {
          transferable.push({ id: b.id, name: `${w.warehouse_name} / ${item.name} / ${b.batch_no}（余 ${b.quantity}）` });
        }
      }
    }
  }
  document.querySelectorAll('select[name="batch_id"]').forEach((s) => fillSelect(s, transferable));
}

async function reload() {
  const qs = state.warehouseId ? `?warehouse_id=${state.warehouseId}` : '';
  const [inventory, releases, orders] = await Promise.all([
    api(`/api/inventory${qs}`),
    api(`/api/releases${qs ? `${qs}&limit=10` : '?limit=10'}`),
    api('/api/dispatch'),
  ]);
  state.inventory = inventory;
  state.releases = releases.records;
  state.orders = orders.orders;
  renderSummary();
  renderInventory();
  renderReleases();
  renderPending();
  renderFormOptions();
  $('#lastRefresh').textContent = new Date().toLocaleString('zh-CN', { hour12: false });
}

async function boot() {
  state.meta = await api('/api/meta');
  const whSelect = $('#warehouseSelect');
  whSelect.innerHTML = '<option value="">全部仓库</option>' + state.meta.warehouses.map((w) => `<option value="${w.id}">${esc(w.name)}</option>`).join('');
  whSelect.addEventListener('change', () => {
    state.warehouseId = whSelect.value;
    reload().catch((e) => toast(e.message, 'error'));
  });
  await reload();
}

$('#refreshBtn').addEventListener('click', () => reload().catch((e) => toast(e.message, 'error')));
setInterval(() => {
  if ($('#autoRefresh').checked) reload().catch(() => {});
}, 5000);

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

$('#inboundForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = formValues(e.target);
  try {
    await api('/api/batches', {
      method: 'POST',
      body: {
        warehouse_id: Number(v.warehouse_id),
        supply_item_id: Number(v.supply_item_id),
        batch_no: v.batch_no,
        quantity: Number(v.quantity),
        expire_at: new Date(`${v.expire_at}T00:00:00Z`).toISOString(),
        quality_status: v.quality_status,
        inbound_source: v.inbound_source || '',
      },
    });
    toast('入库成功', 'ok');
    e.target.reset();
    await reload();
  } catch (err) {
    toast(err.message, 'error');
  }
});

$('#claimForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = formValues(e.target);
  try {
    const r = await api('/api/dispatch/claim', {
      method: 'POST',
      body: {
        warehouse_id: Number(v.warehouse_id),
        shelter_id: Number(v.shelter_id),
        requested_by: v.requested_by,
        lines: [{ batch_id: Number(v.batch_id), quantity: Number(v.quantity) }],
      },
    });
    toast(`普通调拨单 #${r.order.id} 已放行`, 'ok');
    e.target.reset();
    await reload();
  } catch (err) {
    toast(`申领被拒绝：${err.message}`, 'error');
    await reload();
  }
});

$('#emergencyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = formValues(e.target);
  try {
    const r = await api('/api/dispatch/emergency', {
      method: 'POST',
      body: {
        warehouse_id: Number(v.warehouse_id),
        shelter_id: Number(v.shelter_id),
        requested_by: v.requested_by,
        lines: [{ batch_id: Number(v.batch_id), quantity: Number(v.quantity) }],
      },
    });
    toast(`应急调拨单 #${r.order.id} 已提交，待审批员放行`, 'ok');
    e.target.reset();
    await reload();
  } catch (err) {
    toast(err.message, 'error');
  }
});

$('#pendingTable').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-release]');
  if (!btn) return;
  const orderId = btn.dataset.release;
  const reason = window.prompt(`应急调拨单 #${orderId} 放行原因（必填）：`);
  if (reason === null) return;
  const approvedBy = window.prompt('审批人姓名：', '王审批') || '审批员';
  try {
    await api(`/api/dispatch/${orderId}/release`, {
      method: 'POST',
      body: { approved_by: approvedBy, approve_reason: reason },
    });
    toast(`应急调拨单 #${orderId} 已放行`, 'ok');
    await reload();
  } catch (err) {
    toast(`放行失败：${err.message}`, 'error');
    await reload();
  }
});

boot().catch((e) => toast(`初始化失败：${e.message}`, 'error'));
