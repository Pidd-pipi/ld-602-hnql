/** 本地兜底数据：仅在后端不可达时使用，形状与后端 DTO 一致。 */
export const mockData = {
  warehouse: [
    { id: 1, name: "城东应急储备库", district: "城东区", address: "城东街道防灾路 12 号", manager_id: "u1001", capacity_level: "LARGE", contact_phone: "13800000001", status: "ACTIVE" },
    { id: 2, name: "滨江中心仓库", district: "滨江区", address: "滨江大道 88 号", manager_id: "u1002", capacity_level: "MEDIUM", contact_phone: "13800000002", status: "ACTIVE" },
    { id: 3, name: "西山前置仓", district: "西山区", address: "西山社区服务站旁", manager_id: "u1003", capacity_level: "SMALL", contact_phone: "13800000003", status: "ACTIVE" }
  ],
  supplyItem: [
    { id: 1, sku_code: "WATER-550", name: "矿泉水 550ml", category: "WATER", unit: "瓶", safety_stock: 200, expire_days: 540, storage_requirement: "阴凉避光" },
    { id: 2, sku_code: "FOOD-COMPR", name: "压缩饼干", category: "FOOD", unit: "箱", safety_stock: 100, expire_days: 720, storage_requirement: "干燥通风" },
    { id: 3, sku_code: "MED-FIRST", name: "急救包", category: "MEDICAL", unit: "套", safety_stock: 50, expire_days: 360, storage_requirement: "常温密封" },
    { id: 4, sku_code: "SHELTER-TENT", name: "应急帐篷", category: "SHELTER", unit: "顶", safety_stock: 30, expire_days: 1825, storage_requirement: "防潮" },
    { id: 5, sku_code: "TOOL-ROPE", name: "救援绳", category: "RESCUE_TOOL", unit: "卷", safety_stock: 40, expire_days: 1095, storage_requirement: "避光防霉" }
  ],
  inventoryBatch: [
    { id: 1, warehouse_id: 1, warehouse_name: "城东应急储备库", supply_item_id: 1, item_name: "矿泉水 550ml", unit: "瓶", batch_no: "B2026-0901-W1", quantity: 500, expire_at: "2027-07-16 00:00:00", inbound_source: "市应急局调拨", quality_status: "QUALIFIED", bucket: "AVAILABLE", dispatchable: true },
    { id: 2, warehouse_id: 1, warehouse_name: "城东应急储备库", supply_item_id: 1, item_name: "矿泉水 550ml", unit: "瓶", batch_no: "B2026-0602-W1", quantity: 120, expire_at: "2026-10-07 00:00:00", inbound_source: "社会捐赠", quality_status: "QUALIFIED", bucket: "NEAR_EXPIRY", dispatchable: true },
    { id: 3, warehouse_id: 1, warehouse_name: "城东应急储备库", supply_item_id: 2, item_name: "压缩饼干", unit: "箱", batch_no: "B2026-0801-F1", quantity: 260, expire_at: "2027-10-24 00:00:00", inbound_source: "集中采购", quality_status: "QUALIFIED", bucket: "AVAILABLE", dispatchable: true },
    { id: 4, warehouse_id: 1, warehouse_name: "城东应急储备库", supply_item_id: 3, item_name: "急救包", unit: "套", batch_no: "B2026-0701-M1", quantity: 80, expire_at: "2026-10-14 00:00:00", inbound_source: "红十字会移交", quality_status: "QUALIFIED", bucket: "NEAR_EXPIRY", dispatchable: true },
    { id: 5, warehouse_id: 1, warehouse_name: "城东应急储备库", supply_item_id: 3, item_name: "急救包", unit: "套", batch_no: "B2026-0915-M2", quantity: 60, expire_at: "2027-04-07 00:00:00", inbound_source: "集中采购", quality_status: "PENDING_QC", bucket: "FROZEN", dispatchable: false },
    { id: 6, warehouse_id: 2, warehouse_name: "滨江中心仓库", supply_item_id: 1, item_name: "矿泉水 550ml", unit: "瓶", batch_no: "B2026-0501-W2", quantity: 90, expire_at: "2026-09-14 00:00:00", inbound_source: "集中采购", quality_status: "QUALIFIED", bucket: "FROZEN", dispatchable: false },
    { id: 7, warehouse_id: 2, warehouse_name: "滨江中心仓库", supply_item_id: 4, item_name: "应急帐篷", unit: "顶", batch_no: "B2026-0401-S1", quantity: 45, expire_at: "2029-03-08 00:00:00", inbound_source: "政府采购", quality_status: "QUALIFIED", bucket: "AVAILABLE", dispatchable: true },
    { id: 8, warehouse_id: 2, warehouse_name: "滨江中心仓库", supply_item_id: 5, item_name: "救援绳", unit: "卷", batch_no: "B2026-0301-T1", quantity: 35, expire_at: "2028-05-12 00:00:00", inbound_source: "政府采购", quality_status: "UNQUALIFIED", bucket: "FROZEN", dispatchable: false },
    { id: 9, warehouse_id: 3, warehouse_name: "西山前置仓", supply_item_id: 2, item_name: "压缩饼干", unit: "箱", batch_no: "B2026-0910-F2", quantity: 150, expire_at: "2026-10-01 00:00:00", inbound_source: "企业捐赠", quality_status: "QUALIFIED", bucket: "NEAR_EXPIRY", dispatchable: true },
    { id: 10, warehouse_id: 3, warehouse_name: "西山前置仓", supply_item_id: 4, item_name: "应急帐篷", unit: "顶", batch_no: "B2026-0912-S2", quantity: 20, expire_at: "2028-11-27 00:00:00", inbound_source: "政府采购", quality_status: "PENDING_QC", bucket: "FROZEN", dispatchable: false }
  ],
  stockSummary: [
    { warehouse_id: 1, supply_item_id: 1, item_name: "矿泉水 550ml", sku_code: "WATER-550", category: "WATER", unit: "瓶", safety_stock: 200, available: 500, near_expiry: 120, frozen: 0, dispatchable: 620, below_safety: false },
    { warehouse_id: 1, supply_item_id: 2, item_name: "压缩饼干", sku_code: "FOOD-COMPR", category: "FOOD", unit: "箱", safety_stock: 100, available: 260, near_expiry: 0, frozen: 0, dispatchable: 260, below_safety: false },
    { warehouse_id: 1, supply_item_id: 3, item_name: "急救包", sku_code: "MED-FIRST", category: "MEDICAL", unit: "套", safety_stock: 50, available: 0, near_expiry: 80, frozen: 60, dispatchable: 80, below_safety: false },
    { warehouse_id: 2, supply_item_id: 1, item_name: "矿泉水 550ml", sku_code: "WATER-550", category: "WATER", unit: "瓶", safety_stock: 200, available: 0, near_expiry: 0, frozen: 90, dispatchable: 0, below_safety: true },
    { warehouse_id: 2, supply_item_id: 4, item_name: "应急帐篷", sku_code: "SHELTER-TENT", category: "SHELTER", unit: "顶", safety_stock: 30, available: 45, near_expiry: 0, frozen: 0, dispatchable: 45, below_safety: false },
    { warehouse_id: 2, supply_item_id: 5, item_name: "救援绳", sku_code: "TOOL-ROPE", category: "RESCUE_TOOL", unit: "卷", safety_stock: 40, available: 0, near_expiry: 0, frozen: 35, dispatchable: 0, below_safety: true },
    { warehouse_id: 3, supply_item_id: 2, item_name: "压缩饼干", sku_code: "FOOD-COMPR", category: "FOOD", unit: "箱", safety_stock: 100, available: 0, near_expiry: 150, frozen: 0, dispatchable: 150, below_safety: false },
    { warehouse_id: 3, supply_item_id: 4, item_name: "应急帐篷", sku_code: "SHELTER-TENT", category: "SHELTER", unit: "顶", safety_stock: 30, available: 0, near_expiry: 0, frozen: 20, dispatchable: 0, below_safety: true }
  ],
  shelter: [
    { id: 1, name: "城东一中安置点", district: "城东区", capacity: 800, current_population: 0, contact_person: "陈老师", risk_level: "MEDIUM", open_status: "STANDBY" },
    { id: 2, name: "滨江体育馆安置点", district: "滨江区", capacity: 1500, current_population: 120, contact_person: "刘馆长", risk_level: "HIGH", open_status: "OPEN" },
    { id: 3, name: "西山社区安置点", district: "西山区", capacity: 300, current_population: 0, contact_person: "王主任", risk_level: "LOW", open_status: "CLOSED" }
  ],
  dispatchOrder: [
    {
      id: 1, event_id: null, source_warehouse_id: 1, warehouse_name: "城东应急储备库",
      shelter_id: 2, shelter_name: "滨江体育馆安置点", priority: "NORMAL", status: "DISPATCHED",
      requested_by: "u1001", approved_by: "u2001", approve_reason: "例行补充安置点饮用水", reject_reason: "",
      dispatched_at: "2026-09-17 10:00:00", created_at: "2026-09-16 09:00:00",
      lines: [{ id: 1, batch_id: 1, batch_no: "B2026-0901-W1", supply_item_id: 1, item_name: "矿泉水 550ml", quantity: 50 }]
    }
  ],
  releaseRecord: [
    { id: 1, dispatch_order_id: 1, batch_id: 1, batch_no: "B2026-0901-W1", warehouse_id: 1, warehouse_name: "城东应急储备库", supply_item_id: 1, item_name: "矿泉水 550ml", quantity: 50, priority: "NORMAL", approved_by: "u2001", reason: "例行补充安置点饮用水", created_at: "2026-09-17 10:00:00" }
  ]
} as const;
