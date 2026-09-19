package com.generated.rescueStock.services;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.generated.rescueStock.constants.BatchBucket;
import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.constants.ErrorMessages;
import com.generated.rescueStock.constants.LogTemplates;
import com.generated.rescueStock.constants.QualityStatus;
import com.generated.rescueStock.constructors.InventoryBatchDtoFactory;
import com.generated.rescueStock.constructors.StockSummaryDtoFactory;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.models.SupplyItem;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.repositories.InventoryBatchMapper;
import com.generated.rescueStock.repositories.SupplyItemMapper;
import com.generated.rescueStock.repositories.WarehouseMapper;
import com.generated.rescueStock.types.BizException;
import com.generated.rescueStock.types.InboundPayload;
import com.generated.rescueStock.types.QualityCheckPayload;
import com.generated.rescueStock.utils.Formatters;
import com.generated.rescueStock.utils.UserContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class InventoryBatchService {
  private final InventoryBatchMapper batchMapper;
  private final SupplyItemMapper itemMapper;
  private final WarehouseMapper warehouseMapper;
  private final AuditLogService audit;
  private final int nearExpireDays;

  public InventoryBatchService(InventoryBatchMapper batchMapper, SupplyItemMapper itemMapper,
                               WarehouseMapper warehouseMapper, AuditLogService audit,
                               @Value("${app.near-expire-days:30}") int nearExpireDays) {
    this.batchMapper = batchMapper;
    this.itemMapper = itemMapper;
    this.warehouseMapper = warehouseMapper;
    this.audit = audit;
    this.nearExpireDays = nearExpireDays;
  }

  /** 批次列表：按到期日与质检状态计算三态归属。 */
  public List<Map<String, Object>> list(Long warehouseId) {
    LocalDateTime now = LocalDateTime.now();
    QueryWrapper<InventoryBatch> query = new QueryWrapper<>();
    if (warehouseId != null) query.eq("warehouse_id", warehouseId);
    query.orderByAsc("expire_at");
    List<InventoryBatch> batches = batchMapper.selectList(query);
    Map<Long, SupplyItem> items = itemMapper.selectList(null).stream()
        .collect(Collectors.toMap(item -> item.id, Function.identity()));
    Map<Long, Warehouse> warehouses = warehouseMapper.selectList(null).stream()
        .collect(Collectors.toMap(warehouse -> warehouse.id, Function.identity()));
    return batches.stream()
        .map(batch -> InventoryBatchDtoFactory.toResponse(
            batch, items.get(batch.supplyItemId), warehouses.get(batch.warehouseId), now, nearExpireDays))
        .toList();
  }

  /** 库存汇总：按 仓库×物资 聚合 可用/临期/冻结 三类数量，可调拨量 = 可用 + 临期。 */
  public List<Map<String, Object>> summary(Long warehouseId) {
    LocalDateTime now = LocalDateTime.now();
    QueryWrapper<InventoryBatch> query = new QueryWrapper<>();
    if (warehouseId != null) query.eq("warehouse_id", warehouseId);
    List<InventoryBatch> batches = batchMapper.selectList(query);
    List<SupplyItem> items = itemMapper.selectList(null);

    Map<String, int[]> grouped = new LinkedHashMap<>();
    for (InventoryBatch batch : batches) {
      String key = batch.warehouseId + ":" + batch.supplyItemId;
      int[] sums = grouped.computeIfAbsent(key, k -> new int[3]);
      BatchBucket bucket = BatchBucket.of(batch.qualityStatus, batch.expireAt, now, nearExpireDays);
      if (bucket == BatchBucket.AVAILABLE) sums[0] += batch.quantity;
      else if (bucket == BatchBucket.NEAR_EXPIRY) sums[1] += batch.quantity;
      else sums[2] += batch.quantity;
    }

    List<Map<String, Object>> rows = new ArrayList<>();
    for (Map.Entry<String, int[]> entry : grouped.entrySet()) {
      Long itemId = Long.valueOf(entry.getKey().split(":")[1]);
      Long whId = Long.valueOf(entry.getKey().split(":")[0]);
      SupplyItem item = items.stream().filter(it -> it.id.equals(itemId)).findFirst().orElse(null);
      if (item == null) continue;
      int[] sums = entry.getValue();
      rows.add(StockSummaryDtoFactory.row(whId, item, sums[0], sums[1], sums[2]));
    }
    return rows;
  }

  /** 批次入库：默认待检（冻结），质检合格后才进入可调拨量。 */
  public Map<String, Object> inbound(InboundPayload payload) {
    if (payload.warehouseId() == null || payload.supplyItemId() == null
        || payload.batchNo() == null || payload.batchNo().isBlank()
        || payload.quantity() == null || payload.quantity() <= 0
        || payload.expireAt() == null || payload.expireAt().isBlank()) {
      throw new BizException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED);
    }
    InventoryBatch batch = new InventoryBatch();
    batch.warehouseId = payload.warehouseId();
    batch.supplyItemId = payload.supplyItemId();
    batch.batchNo = payload.batchNo();
    batch.quantity = payload.quantity();
    batch.expireAt = LocalDateTime.parse(payload.expireAt().replace(' ', 'T').length() == 16
        ? payload.expireAt().replace(' ', 'T') + ":00" : payload.expireAt().replace(' ', 'T'));
    batch.inboundSource = Formatters.blankToDefault(payload.inboundSource(), "手工入库");
    batch.qualityStatus = Formatters.blankToDefault(payload.qualityStatus(), QualityStatus.PENDING_QC.name());
    batch.createdAt = LocalDateTime.now();
    batchMapper.insert(batch);
    audit.record(UserContext.actor(),
        String.format(LogTemplates.BATCH_INBOUND, batch.batchNo, batch.quantity, batch.qualityStatus, UserContext.actor()),
        "InventoryBatch", String.valueOf(batch.id), "inbound");
    return list(null).stream().filter(row -> batch.id.equals(row.get("id"))).findFirst().orElse(Map.of());
  }

  /** 质检：合格/不合格状态变更，直接影响冻结与可调拨口径。 */
  public Map<String, Object> updateQuality(Long id, QualityCheckPayload payload) {
    InventoryBatch batch = batchMapper.selectById(id);
    if (batch == null) throw new BizException(ErrorCodes.BATCH_NOT_FOUND, ErrorMessages.BATCH_NOT_FOUND);
    String status = payload.qualityStatus();
    try {
      QualityStatus.valueOf(status == null ? "" : status);
    } catch (IllegalArgumentException ex) {
      throw new BizException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED);
    }
    batch.qualityStatus = status;
    batchMapper.updateById(batch);
    audit.record(UserContext.actor(),
        String.format(LogTemplates.BATCH_QUALITY, id, status, UserContext.actor()),
        "InventoryBatch", String.valueOf(id), "quality");
    return list(null).stream().filter(row -> id.equals(row.get("id"))).findFirst().orElse(Map.of());
  }
}
