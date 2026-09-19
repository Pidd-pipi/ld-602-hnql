package com.generated.rescueStock.services;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.generated.rescueStock.constants.BatchBucket;
import com.generated.rescueStock.constants.DispatchPriority;
import com.generated.rescueStock.constants.DispatchStatus;
import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.constants.ErrorMessages;
import com.generated.rescueStock.constants.LogTemplates;
import com.generated.rescueStock.constructors.DispatchOrderDtoFactory;
import com.generated.rescueStock.models.DispatchLine;
import com.generated.rescueStock.models.DispatchOrder;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.models.ReleaseRecord;
import com.generated.rescueStock.models.Shelter;
import com.generated.rescueStock.models.SupplyItem;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.repositories.DispatchLineMapper;
import com.generated.rescueStock.repositories.DispatchOrderMapper;
import com.generated.rescueStock.repositories.InventoryBatchMapper;
import com.generated.rescueStock.repositories.ReleaseRecordMapper;
import com.generated.rescueStock.repositories.ShelterMapper;
import com.generated.rescueStock.repositories.SupplyItemMapper;
import com.generated.rescueStock.repositories.WarehouseMapper;
import com.generated.rescueStock.types.BizException;
import com.generated.rescueStock.types.DispatchCreatePayload;
import com.generated.rescueStock.types.DispatchLinePayload;
import com.generated.rescueStock.utils.UserContext;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DispatchOrderService {
  private final DispatchOrderMapper orderMapper;
  private final DispatchLineMapper lineMapper;
  private final InventoryBatchMapper batchMapper;
  private final SupplyItemMapper itemMapper;
  private final WarehouseMapper warehouseMapper;
  private final ShelterMapper shelterMapper;
  private final ReleaseRecordMapper releaseMapper;
  private final AuditLogService audit;

  public DispatchOrderService(DispatchOrderMapper orderMapper, DispatchLineMapper lineMapper,
                              InventoryBatchMapper batchMapper, SupplyItemMapper itemMapper,
                              WarehouseMapper warehouseMapper, ShelterMapper shelterMapper,
                              ReleaseRecordMapper releaseMapper, AuditLogService audit) {
    this.orderMapper = orderMapper;
    this.lineMapper = lineMapper;
    this.batchMapper = batchMapper;
    this.itemMapper = itemMapper;
    this.warehouseMapper = warehouseMapper;
    this.shelterMapper = shelterMapper;
    this.releaseMapper = releaseMapper;
    this.audit = audit;
  }

  public List<Map<String, Object>> list() {
    List<DispatchOrder> orders = orderMapper.selectList(
        new QueryWrapper<DispatchOrder>().orderByDesc("id"));
    return orders.stream().map(this::toDto).toList();
  }

  @Transactional
  public Map<String, Object> create(DispatchCreatePayload payload) {
    if (payload.sourceWarehouseId() == null || payload.shelterId() == null
        || payload.lines() == null || payload.lines().isEmpty()) {
      throw new BizException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED);
    }
    String priority = payload.priority() == null || payload.priority().isBlank()
        ? DispatchPriority.NORMAL.name() : payload.priority();
    try {
      DispatchPriority.valueOf(priority);
    } catch (IllegalArgumentException ex) {
      throw new BizException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED);
    }
    LocalDateTime now = LocalDateTime.now();
    // 创建即校验批次归属与可拨状态，冻结批次（待检/不合格/已过期）直接拒绝
    for (DispatchLinePayload line : payload.lines()) {
      if (line.batchId() == null || line.quantity() == null || line.quantity() <= 0) {
        throw new BizException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED);
      }
      InventoryBatch batch = batchMapper.selectById(line.batchId());
      if (batch == null) {
        throw new BizException(ErrorCodes.BATCH_NOT_FOUND, ErrorMessages.BATCH_NOT_FOUND);
      }
      if (!batch.warehouseId.equals(payload.sourceWarehouseId())) {
        throw new BizException(ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED);
      }
      if (!BatchBucket.dispatchable(batch.qualityStatus, batch.expireAt, now)) {
        audit.record(UserContext.actor(),
            String.format(LogTemplates.BATCH_FROZEN, batch.batchNo, batch.qualityStatus),
            "InventoryBatch", String.valueOf(batch.id), "frozen-reject");
        throw new BizException(ErrorCodes.BATCH_NOT_DISPATCHABLE, ErrorMessages.BATCH_NOT_DISPATCHABLE);
      }
    }

    DispatchOrder order = new DispatchOrder();
    order.eventId = payload.eventId();
    order.sourceWarehouseId = payload.sourceWarehouseId();
    order.shelterId = payload.shelterId();
    order.priority = priority;
    order.status = DispatchStatus.SUBMITTED.name();
    order.requestedBy = UserContext.actor();
    order.createdAt = now;
    orderMapper.insert(order);

    for (DispatchLinePayload linePayload : payload.lines()) {
      InventoryBatch batch = batchMapper.selectById(linePayload.batchId());
      DispatchLine line = new DispatchLine();
      line.dispatchOrderId = order.id;
      line.batchId = linePayload.batchId();
      line.supplyItemId = batch.supplyItemId;
      line.quantity = linePayload.quantity();
      lineMapper.insert(line);
    }
    audit.record(UserContext.actor(),
        String.format(LogTemplates.DISPATCH_CREATE, order.id, priority, payload.lines().size(), UserContext.actor()),
        "DispatchOrder", String.valueOf(order.id), "create");
    return toDto(orderMapper.selectById(order.id));
  }

  /**
   * 审批放行：
   * 1. 普通调拨扣减后任一物资低于安全库存 → 整单置 REJECTED，不扣任何库存；
   * 2. 应急调拨须审批员填写原因，可突破安全库存放行；
   * 3. 扣减走原子 SQL，并发申领同一批次只成功一单，失败方事务回滚、库存不变。
   */
  @Transactional
  public Map<String, Object> approve(Long orderId, String reason) {
    DispatchOrder order = orderMapper.selectById(orderId);
    if (order == null) {
      throw new BizException(ErrorCodes.DISPATCH_NOT_FOUND, ErrorMessages.DISPATCH_NOT_FOUND);
    }
    if (!DispatchStatus.SUBMITTED.name().equals(order.status)) {
      throw new BizException(ErrorCodes.DISPATCH_NOT_ACTIONABLE, ErrorMessages.DISPATCH_NOT_ACTIONABLE);
    }
    boolean emergency = DispatchPriority.EMERGENCY.name().equals(order.priority);
    if (emergency && (reason == null || reason.isBlank())) {
      throw new BizException(ErrorCodes.REASON_REQUIRED, ErrorMessages.REASON_REQUIRED);
    }
    List<DispatchLine> lines = lineMapper.selectList(
        new QueryWrapper<DispatchLine>().eq("dispatch_order_id", orderId));
    LocalDateTime now = LocalDateTime.now();

    // 放行前复核：冻结批次与超量申领直接失败
    for (DispatchLine line : lines) {
      InventoryBatch batch = batchMapper.selectById(line.batchId);
      if (batch == null) {
        throw new BizException(ErrorCodes.BATCH_NOT_FOUND, ErrorMessages.BATCH_NOT_FOUND);
      }
      if (!BatchBucket.dispatchable(batch.qualityStatus, batch.expireAt, now)) {
        throw new BizException(ErrorCodes.BATCH_NOT_DISPATCHABLE, ErrorMessages.BATCH_NOT_DISPATCHABLE);
      }
      if (batch.quantity < line.quantity) {
        throw new BizException(ErrorCodes.INSUFFICIENT_STOCK, ErrorMessages.INSUFFICIENT_STOCK);
      }
    }

    // 普通调拨安全库存校验：任一物资拨后低于安全库存 → 整单拒绝
    if (!emergency) {
      Map<Long, Integer> deductByItem = new HashMap<>();
      for (DispatchLine line : lines) {
        deductByItem.merge(line.supplyItemId, line.quantity, Integer::sum);
      }
      for (Map.Entry<Long, Integer> entry : deductByItem.entrySet()) {
        SupplyItem item = itemMapper.selectById(entry.getKey());
        int safetyStock = item == null || item.safetyStock == null ? 0 : item.safetyStock;
        int dispatchable = batchMapper.sumDispatchable(order.sourceWarehouseId, entry.getKey());
        int remain = dispatchable - entry.getValue();
        if (remain < safetyStock) {
          order.status = DispatchStatus.REJECTED.name();
          order.approvedBy = UserContext.actor();
          order.rejectReason = ErrorMessages.SAFETY_STOCK_BREACH;
          orderMapper.updateById(order);
          audit.record(UserContext.actor(),
              String.format(LogTemplates.DISPATCH_SAFETY_REJECT, orderId, entry.getKey(), remain, safetyStock),
              "DispatchOrder", String.valueOf(orderId), "safety-reject");
          return toDto(orderMapper.selectById(orderId));
        }
      }
    }

    // 原子扣减：并发下只有一单能扣成，失败方抛错回滚，库存不变
    for (DispatchLine line : lines) {
      int updated = batchMapper.deductDispatchable(line.batchId, line.quantity);
      if (updated == 0) {
        audit.record(UserContext.actor(),
            String.format(LogTemplates.DISPATCH_CONCURRENT_FAIL, orderId, line.batchId),
            "DispatchOrder", String.valueOf(orderId), "concurrent-fail");
        throw new BizException(ErrorCodes.CONCURRENT_CLAIM_FAILED, ErrorMessages.CONCURRENT_CLAIM_FAILED);
      }
    }

    order.status = DispatchStatus.DISPATCHED.name();
    order.approvedBy = UserContext.actor();
    order.approveReason = reason == null ? "" : reason;
    order.dispatchedAt = now;
    orderMapper.updateById(order);

    // 库存流水：每行明细写一条放行记录
    for (DispatchLine line : lines) {
      InventoryBatch batch = batchMapper.selectById(line.batchId);
      ReleaseRecord record = new ReleaseRecord();
      record.dispatchOrderId = orderId;
      record.batchId = line.batchId;
      record.warehouseId = order.sourceWarehouseId;
      record.supplyItemId = line.supplyItemId;
      record.quantity = line.quantity;
      record.priority = order.priority;
      record.approvedBy = UserContext.actor();
      record.reason = order.approveReason;
      record.createdAt = now;
      releaseMapper.insert(record);
      if (batch != null && batch.expireAt != null
          && batch.expireAt.isBefore(now.plusDays(30)) && batch.expireAt.isAfter(now)) {
        audit.record(UserContext.actor(),
            String.format(LogTemplates.BATCH_EXPIRE_WARN, batch.batchNo, batch.expireAt),
            "InventoryBatch", String.valueOf(batch.id), "expire-warn");
      }
    }
    String template = emergency ? LogTemplates.DISPATCH_EMERGENCY_RELEASE : LogTemplates.DISPATCH_RELEASE;
    audit.record(UserContext.actor(),
        String.format(template, orderId, UserContext.actor(), order.approveReason),
        "DispatchOrder", String.valueOf(orderId), "release");
    return toDto(orderMapper.selectById(orderId));
  }

  /** 审批驳回：必须填写原因，不动库存。 */
  @Transactional
  public Map<String, Object> reject(Long orderId, String reason) {
    DispatchOrder order = orderMapper.selectById(orderId);
    if (order == null) {
      throw new BizException(ErrorCodes.DISPATCH_NOT_FOUND, ErrorMessages.DISPATCH_NOT_FOUND);
    }
    if (!DispatchStatus.SUBMITTED.name().equals(order.status)) {
      throw new BizException(ErrorCodes.DISPATCH_NOT_ACTIONABLE, ErrorMessages.DISPATCH_NOT_ACTIONABLE);
    }
    if (reason == null || reason.isBlank()) {
      throw new BizException(ErrorCodes.REASON_REQUIRED, ErrorMessages.REASON_REQUIRED);
    }
    order.status = DispatchStatus.REJECTED.name();
    order.approvedBy = UserContext.actor();
    order.rejectReason = reason;
    orderMapper.updateById(order);
    audit.record(UserContext.actor(),
        String.format(LogTemplates.DISPATCH_REJECT, orderId, UserContext.actor(), reason),
        "DispatchOrder", String.valueOf(orderId), "reject");
    return toDto(orderMapper.selectById(orderId));
  }

  private Map<String, Object> toDto(DispatchOrder order) {
    List<DispatchLine> lines = lineMapper.selectList(
        new QueryWrapper<DispatchLine>().eq("dispatch_order_id", order.id));
    Warehouse warehouse = warehouseMapper.selectById(order.sourceWarehouseId);
    Shelter shelter = shelterMapper.selectById(order.shelterId);
    Map<Long, String> batchNos = lines.stream()
        .map(line -> batchMapper.selectById(line.batchId))
        .filter(batch -> batch != null)
        .collect(Collectors.toMap(batch -> batch.id, batch -> batch.batchNo, (a, b) -> a));
    Map<Long, String> itemNames = itemMapper.selectList(null).stream()
        .collect(Collectors.toMap(item -> item.id, item -> item.name));
    return DispatchOrderDtoFactory.toResponse(order, lines,
        warehouse == null ? "" : warehouse.name,
        shelter == null ? "" : shelter.name,
        batchNos, itemNames);
  }

  /** 供 controller 判断安全库存整单拒绝的场景，返回 409。 */
  public static boolean isSafetyRejected(Map<String, Object> dto) {
    return DispatchStatus.REJECTED.name().equals(dto.get("status"))
        && ErrorMessages.SAFETY_STOCK_BREACH.equals(dto.get("reject_reason"));
  }
}
