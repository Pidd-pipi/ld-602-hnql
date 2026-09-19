-- rescue-stock 数据库初始化（MySQL 8.0）
-- 临期物资管控闭环：批次三态（可用/临期/冻结）+ 调拨审批 + 放行记录

CREATE TABLE IF NOT EXISTS warehouse (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  district VARCHAR(64) NOT NULL,
  address VARCHAR(255) NOT NULL,
  manager_id VARCHAR(64) NOT NULL,
  capacity_level VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  contact_phone VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS supply_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(32) NOT NULL,
  unit VARCHAR(16) NOT NULL,
  safety_stock INT NOT NULL DEFAULT 0,
  expire_days INT NOT NULL DEFAULT 365,
  storage_requirement VARCHAR(255) NOT NULL DEFAULT ''
);

-- 质检状态：PENDING_QC 待检 / QUALIFIED 合格 / UNQUALIFIED 不合格
-- 冻结 = 待检、不合格或已过期；冻结数量不得进入可调拨量
CREATE TABLE IF NOT EXISTS inventory_batch (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  warehouse_id BIGINT NOT NULL,
  supply_item_id BIGINT NOT NULL,
  batch_no VARCHAR(64) NOT NULL UNIQUE,
  quantity INT NOT NULL,
  expire_at DATETIME NOT NULL,
  inbound_source VARCHAR(128) NOT NULL,
  quality_status VARCHAR(16) NOT NULL DEFAULT 'PENDING_QC',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_batch_wh_item (warehouse_id, supply_item_id),
  CONSTRAINT fk_batch_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
  CONSTRAINT fk_batch_item FOREIGN KEY (supply_item_id) REFERENCES supply_item(id)
);

CREATE TABLE IF NOT EXISTS shelter (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  district VARCHAR(64) NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  current_population INT NOT NULL DEFAULT 0,
  contact_person VARCHAR(64) NOT NULL,
  risk_level VARCHAR(16) NOT NULL DEFAULT 'LOW',
  open_status VARCHAR(16) NOT NULL DEFAULT 'STANDBY'
);

CREATE TABLE IF NOT EXISTS dispatch_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id BIGINT NULL,
  source_warehouse_id BIGINT NOT NULL,
  shelter_id BIGINT NOT NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
  status VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED',
  requested_by VARCHAR(64) NOT NULL,
  approved_by VARCHAR(64) NULL,
  approve_reason VARCHAR(255) NULL,
  reject_reason VARCHAR(255) NULL,
  dispatched_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispatch_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatch_order_id BIGINT NOT NULL,
  batch_id BIGINT NOT NULL,
  supply_item_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  CONSTRAINT fk_line_order FOREIGN KEY (dispatch_order_id) REFERENCES dispatch_order(id),
  CONSTRAINT fk_line_batch FOREIGN KEY (batch_id) REFERENCES inventory_batch(id)
);

-- 放行记录：每次调拨放行按明细行留痕，库存页展示最近记录
CREATE TABLE IF NOT EXISTS release_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dispatch_order_id BIGINT NOT NULL,
  batch_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  supply_item_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  priority VARCHAR(16) NOT NULL,
  approved_by VARCHAR(64) NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_release_wh (warehouse_id, created_at)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  actor VARCHAR(64) NOT NULL,
  action VARCHAR(128) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  detail VARCHAR(512) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================= 种子数据 =================
-- 到期日均相对当前时间生成，保证任意时间启动后三态分布稳定

INSERT INTO warehouse (id, name, district, address, manager_id, capacity_level, contact_phone, status) VALUES
  (1, '城东应急储备库', '城东区', '城东街道防灾路 12 号', 'u1001', 'LARGE', '13800000001', 'ACTIVE'),
  (2, '滨江中心仓库', '滨江区', '滨江大道 88 号', 'u1002', 'MEDIUM', '13800000002', 'ACTIVE'),
  (3, '西山前置仓', '西山区', '西山社区服务站旁', 'u1003', 'SMALL', '13800000003', 'ACTIVE');

INSERT INTO supply_item (id, sku_code, name, category, unit, safety_stock, expire_days, storage_requirement) VALUES
  (1, 'WATER-550', '矿泉水 550ml', 'WATER', '瓶', 200, 540, '阴凉避光'),
  (2, 'FOOD-COMPR', '压缩饼干', 'FOOD', '箱', 100, 720, '干燥通风'),
  (3, 'MED-FIRST', '急救包', 'MEDICAL', '套', 50, 360, '常温密封'),
  (4, 'SHELTER-TENT', '应急帐篷', 'SHELTER', '顶', 30, 1825, '防潮'),
  (5, 'TOOL-ROPE', '救援绳', 'RESCUE_TOOL', '卷', 40, 1095, '避光防霉');

-- 批次覆盖三态：可用（合格且效期充裕）、临期（合格但 30 天内到期）、
-- 冻结（待检 / 不合格 / 已过期）
INSERT INTO inventory_batch
  (id, warehouse_id, supply_item_id, batch_no, quantity, expire_at, inbound_source, quality_status) VALUES
  (1, 1, 1, 'B2026-0901-W1', 500, DATE_ADD(NOW(), INTERVAL 300 DAY), '市应急局调拨', 'QUALIFIED'),
  (2, 1, 1, 'B2026-0602-W1', 120, DATE_ADD(NOW(), INTERVAL 18 DAY),  '社会捐赠',     'QUALIFIED'),
  (3, 1, 2, 'B2026-0801-F1', 260, DATE_ADD(NOW(), INTERVAL 400 DAY), '集中采购',     'QUALIFIED'),
  (4, 1, 3, 'B2026-0701-M1', 80,  DATE_ADD(NOW(), INTERVAL 25 DAY),  '红十字会移交', 'QUALIFIED'),
  (5, 1, 3, 'B2026-0915-M2', 60,  DATE_ADD(NOW(), INTERVAL 200 DAY), '集中采购',     'PENDING_QC'),
  (6, 2, 1, 'B2026-0501-W2', 90,  DATE_SUB(NOW(), INTERVAL 5 DAY),   '集中采购',     'QUALIFIED'),
  (7, 2, 4, 'B2026-0401-S1', 45,  DATE_ADD(NOW(), INTERVAL 900 DAY), '政府采购',     'QUALIFIED'),
  (8, 2, 5, 'B2026-0301-T1', 35,  DATE_ADD(NOW(), INTERVAL 600 DAY), '政府采购',     'UNQUALIFIED'),
  (9, 3, 2, 'B2026-0910-F2', 150, DATE_ADD(NOW(), INTERVAL 12 DAY),  '企业捐赠',     'QUALIFIED'),
  (10, 3, 4, 'B2026-0912-S2', 20, DATE_ADD(NOW(), INTERVAL 800 DAY), '政府采购',     'PENDING_QC');

INSERT INTO shelter (id, name, district, capacity, current_population, contact_person, risk_level, open_status) VALUES
  (1, '城东一中安置点', '城东区', 800, 0, '陈老师', 'MEDIUM', 'STANDBY'),
  (2, '滨江体育馆安置点', '滨江区', 1500, 120, '刘馆长', 'HIGH', 'OPEN'),
  (3, '西山社区安置点', '西山区', 300, 0, '王主任', 'LOW', 'CLOSED');

-- 一条历史放行记录，便于库存页首屏即有数据
INSERT INTO dispatch_order
  (id, event_id, source_warehouse_id, shelter_id, priority, status, requested_by, approved_by, approve_reason, dispatched_at, created_at)
VALUES
  (1, NULL, 1, 2, 'NORMAL', 'DISPATCHED', 'u1001', 'u2001', '例行补充安置点饮用水', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO dispatch_line (dispatch_order_id, batch_id, supply_item_id, quantity) VALUES
  (1, 1, 1, 50);

INSERT INTO release_record
  (dispatch_order_id, batch_id, warehouse_id, supply_item_id, quantity, priority, approved_by, reason, created_at)
VALUES
  (1, 1, 1, 1, 50, 'NORMAL', 'u2001', '例行补充安置点饮用水', DATE_SUB(NOW(), INTERVAL 2 DAY));
