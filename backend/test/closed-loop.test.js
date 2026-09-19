import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from '../src/server.js';

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();

/** 每个测试用例一套独立数据文件 + 随机端口，互不影响。 */
function makeSeedState() {
  return {
    seq: { warehouse: 1, supply_item: 2, shelter: 1, batch: 0, order: 0, release: 0, audit: 0 },
    warehouses: [{ id: 1, name: '测试仓库', district: '测试区', status: 'OPEN' }],
    supply_items: [
      { id: 1, sku_code: 'SKU-WATER', name: '饮用水', category: 'WATER', unit: '箱', safety_stock: 100, expire_days: 365, storage_requirement: '常温' },
      { id: 2, sku_code: 'SKU-FOOD', name: '压缩饼干', category: 'FOOD', unit: '箱', safety_stock: 0, expire_days: 540, storage_requirement: '常温' },
    ],
    shelters: [{ id: 1, name: '测试安置点', district: '测试区', open_status: 'OPEN' }],
    batches: [],
    orders: [],
    releases: [],
    audit_log: [],
  };
}

async function boot(t, { seedState = makeSeedState(), dataFile } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rescue-stock-test-'));
  const file = dataFile || path.join(dir, 'data.json');
  const app = await createServer({
    port: 0,
    host: '127.0.0.1',
    dataFile: file,
    publicDir: path.join(dir, 'public'),
    nearExpiryDays: 30,
    seedState,
  });
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.port}`;
  const api = async (method, p, body, headers = {}) => {
    const res = await fetch(base + p, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  return { app, api, dataFile: file, base };
}

const inbound = (api, over = {}) =>
  api('POST', '/api/batches', {
    warehouse_id: 1,
    supply_item_id: 1,
    batch_no: over.batch_no || `B-${Math.random().toString(36).slice(2, 8)}`,
    quantity: 100,
    expire_at: iso(180),
    quality_status: 'PASSED',
    inbound_source: '测试',
    ...over,
  });

function itemView(inventory, warehouseId, itemId) {
  const wh = inventory.warehouses.find((w) => w.warehouse_id === warehouseId);
  return wh?.items.find((i) => i.supply_item_id === itemId);
}

test('批次入库后按到期日和质检状态分为 可用/临期/冻结，且冻结不计入可调拨量', async (t) => {
  const { api } = await boot(t);
  await inbound(api, { batch_no: 'OK-FAR', quantity: 100, expire_at: iso(180) }); // 可用
  await inbound(api, { batch_no: 'OK-NEAR', quantity: 40, expire_at: iso(10) }); // 临期（≤30天）
  await inbound(api, { batch_no: 'QC-PENDING', quantity: 30, quality_status: 'PENDING_QC' }); // 待检 → 冻结
  await inbound(api, { batch_no: 'QC-REJECT', quantity: 20, quality_status: 'REJECTED' }); // 不合格 → 冻结
  await inbound(api, { batch_no: 'EXPIRED', quantity: 10, expire_at: iso(-1) }); // 已过期 → 冻结

  const { status, body } = await api('GET', '/api/inventory?warehouse_id=1');
  assert.equal(status, 200);
  const item = itemView(body, 1, 1);
  assert.equal(item.available_qty, 100, '可用数量');
  assert.equal(item.near_expiry_qty, 40, '临期数量');
  assert.equal(item.frozen_qty, 60, '冻结数量 = 待检30 + 不合格20 + 已过期10');
  assert.equal(item.transferable_qty, 140, '可调拨量 = 可用 + 临期，不含待检/不合格/已过期');

  const buckets = Object.fromEntries(item.batches.map((b) => [b.batch_no, b.bucket]));
  assert.deepEqual(buckets, {
    'OK-FAR': 'AVAILABLE',
    'OK-NEAR': 'NEAR_EXPIRY',
    'QC-PENDING': 'FROZEN',
    'QC-REJECT': 'FROZEN',
    EXPIRED: 'FROZEN',
  });

  // 冻结批次直接申领 → 拒绝
  const pending = item.batches.find((b) => b.batch_no === 'QC-PENDING');
  const claim = await api('POST', '/api/dispatch/claim', {
    warehouse_id: 1,
    shelter_id: 1,
    requested_by: '张三',
    lines: [{ batch_id: pending.id, quantity: 1 }],
  });
  assert.equal(claim.status, 409);
  assert.equal(claim.body.error.code, 'BATCH_NOT_TRANSFERABLE');
});

test('普通调拨低于安全库存时整单拒绝，且库存不变', async (t) => {
  const { api } = await boot(t);
  const b1 = (await inbound(api, { batch_no: 'SAFE-1', quantity: 120, expire_at: iso(200) })).body.batch;
  const b2 = (await inbound(api, { batch_no: 'SAFE-2', quantity: 50, expire_at: iso(200), supply_item_id: 2 })).body.batch;

  // 120 - 30 = 90 < 安全库存 100 → 整单拒绝（含另一物资的合法行也不扣减）
  const reject = await api('POST', '/api/dispatch/claim', {
    warehouse_id: 1,
    shelter_id: 1,
    requested_by: '张三',
    lines: [
      { batch_id: b1.id, quantity: 30 },
      { batch_id: b2.id, quantity: 10 },
    ],
  });
  assert.equal(reject.status, 409);
  assert.equal(reject.body.error.code, 'SAFETY_STOCK_VIOLATION');

  let inv = itemView((await api('GET', '/api/inventory?warehouse_id=1')).body, 1, 1);
  let inv2 = itemView((await api('GET', '/api/inventory?warehouse_id=1')).body, 1, 2);
  assert.equal(inv.transferable_qty, 120, '整单拒绝后物资1库存不变');
  assert.equal(inv2.transferable_qty, 50, '整单拒绝后物资2库存也不变');
  assert.equal((await api('GET', '/api/releases')).body.records.length, 0, '拒绝单不产生放行记录');

  // 120 - 20 = 100 ≥ 100 → 放行
  const ok = await api('POST', '/api/dispatch/claim', {
    warehouse_id: 1,
    shelter_id: 1,
    requested_by: '张三',
    lines: [{ batch_id: b1.id, quantity: 20 }],
  });
  assert.equal(ok.status, 201);
  inv = itemView((await api('GET', '/api/inventory?warehouse_id=1')).body, 1, 1);
  assert.equal(inv.transferable_qty, 100);
  assert.equal((await api('GET', '/api/releases')).body.records.length, 1);
});

test('应急调拨由审批员填写原因后放行，可突破安全库存', async (t) => {
  const { api } = await boot(t);
  const batch = (await inbound(api, { batch_no: 'EMG-1', quantity: 50, expire_at: iso(10) })).body.batch;

  const submitted = await api('POST', '/api/dispatch/emergency', {
    warehouse_id: 1,
    shelter_id: 1,
    requested_by: '李四',
    lines: [{ batch_id: batch.id, quantity: 50 }],
  });
  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.order.status, 'SUBMITTED');
  let inv = itemView((await api('GET', '/api/inventory?warehouse_id=1')).body, 1, 1);
  assert.equal(inv.transferable_qty, 50, '登记阶段不扣库存');

  const orderId = submitted.body.order.id;
  // 无原因 → 400
  const noReason = await api('POST', `/api/dispatch/${orderId}/release`, { approved_by: '王审批', approve_reason: '' }, { 'x-role': 'approver' });
  assert.equal(noReason.status, 400);
  assert.equal(noReason.body.error.code, 'VALIDATION_ERROR');
  // 非审批员 → 403
  const forbidden = await api('POST', `/api/dispatch/${orderId}/release`, { approved_by: '张三', approve_reason: '救人' }, { 'x-role': 'viewer' });
  assert.equal(forbidden.status, 403);
  // 审批员 + 原因 → 放行（50 - 50 = 0 < 安全库存 100，应急不受限）
  const released = await api('POST', `/api/dispatch/${orderId}/release`, { approved_by: '王审批', approve_reason: '台风夜紧急安置' }, { 'x-role': 'approver' });
  assert.equal(released.status, 200);
  assert.equal(released.body.order.status, 'RELEASED');
  assert.equal(released.body.order.approve_reason, '台风夜紧急安置');

  inv = itemView((await api('GET', '/api/inventory?warehouse_id=1')).body, 1, 1);
  assert.equal(inv.transferable_qty, 0, '应急放行后库存扣减，允许低于安全库存');

  const releases = (await api('GET', '/api/releases?warehouse_id=1')).body.records;
  assert.equal(releases.length, 1);
  assert.equal(releases[0].reason, '台风夜紧急安置');
  assert.equal(releases[0].actor, '王审批');

  // 重复放行 → 409
  const again = await api('POST', `/api/dispatch/${orderId}/release`, { approved_by: '王审批', approve_reason: '重复' }, { 'x-role': 'approver' });
  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, 'ORDER_STATE_INVALID');
});

test('并发申领同一批次只能成功一单，失败方不得改变库存', async (t) => {
  const { api } = await boot(t);
  // 物资2安全库存为 0，排除安全库存干扰，专测并发原子性
  const batch = (await inbound(api, { batch_no: 'RACE-1', quantity: 15, supply_item_id: 2, expire_at: iso(90) })).body.batch;

  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      api('POST', '/api/dispatch/claim', {
        warehouse_id: 1,
        shelter_id: 1,
        requested_by: `并发用户${i}`,
        lines: [{ batch_id: batch.id, quantity: 10 }],
      }),
    ),
  );
  const succeeded = results.filter((r) => r.status === 201);
  const failed = results.filter((r) => r.status !== 201);
  assert.equal(succeeded.length, 1, '只有一单申领成功');
  assert.equal(failed.length, 7);
  for (const f of failed) {
    assert.equal(f.status, 409);
    assert.equal(f.body.error.code, 'INSUFFICIENT_STOCK');
  }

  const inv = itemView((await api('GET', '/api/inventory?warehouse_id=1')).body, 1, 2);
  assert.equal(inv.transferable_qty, 5, '失败方不得改变库存：15 - 10 = 5');
  assert.equal((await api('GET', '/api/releases')).body.records.length, 1, '只产生一条放行记录');
});

test('并发应急放行同一批次同样只有一单成功', async (t) => {
  const { api } = await boot(t);
  const batch = (await inbound(api, { batch_no: 'RACE-EMG', quantity: 40, supply_item_id: 2, expire_at: iso(90) })).body.batch;
  const mk = () =>
    api('POST', '/api/dispatch/emergency', {
      warehouse_id: 1,
      shelter_id: 1,
      requested_by: '调度员',
      lines: [{ batch_id: batch.id, quantity: 30 }],
    });
  const [o1, o2] = await Promise.all([mk(), mk()]);

  const releases = await Promise.all(
    [o1.body.order.id, o2.body.order.id].map((id, i) =>
      api('POST', `/api/dispatch/${id}/release`, { approved_by: `审批员${i}`, approve_reason: '并发放行测试' }, { 'x-role': 'approver' }),
    ),
  );
  assert.equal(releases.filter((r) => r.status === 200).length, 1, '应急放行并发下也只有一单成功');
  const loser = releases.find((r) => r.status !== 200);
  assert.equal(loser.status, 409);
  assert.equal(loser.body.error.code, 'INSUFFICIENT_STOCK');

  const inv = itemView((await api('GET', '/api/inventory?warehouse_id=1')).body, 1, 2);
  assert.equal(inv.transferable_qty, 10, '40 - 30 = 10，失败方未扣减');
});

test('库存页数据与最近放行记录持久化，重启（刷新）后一致', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rescue-stock-persist-'));
  const dataFile = path.join(dir, 'data.json');
  const first = await boot(t, { dataFile });
  await inbound(first.api, { batch_no: 'P-1', quantity: 130, expire_at: iso(100) });
  await inbound(first.api, { batch_no: 'P-2', quantity: 45, expire_at: iso(7) });
  await first.api('POST', '/api/dispatch/claim', {
    warehouse_id: 1,
    shelter_id: 1,
    requested_by: '张三',
    lines: [{ batch_id: 1, quantity: 20 }],
  });
  const beforeInv = (await first.api('GET', '/api/inventory?warehouse_id=1')).body;
  const beforeRel = (await first.api('GET', '/api/releases?warehouse_id=1')).body;
  await first.app.close();

  // 模拟刷新/重启：同一数据文件重新启动
  const second = await boot(t, { dataFile });
  const afterInv = (await second.api('GET', '/api/inventory?warehouse_id=1')).body;
  const afterRel = (await second.api('GET', '/api/releases?warehouse_id=1')).body;

  const strip = (v) => {
    const { generated_at, ...rest } = v;
    return rest;
  };
  assert.deepEqual(strip(afterInv), strip(beforeInv), '重启后三类数量与可调拨量一致');
  assert.deepEqual(afterRel, beforeRel, '重启后最近放行记录一致');
  const item = itemView(afterInv, 1, 1);
  assert.equal(item.available_qty, 110);
  assert.equal(item.near_expiry_qty, 45);
});
