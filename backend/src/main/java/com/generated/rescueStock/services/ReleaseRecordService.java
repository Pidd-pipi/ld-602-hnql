package com.generated.rescueStock.services;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.generated.rescueStock.constructors.ReleaseRecordDtoFactory;
import com.generated.rescueStock.models.InventoryBatch;
import com.generated.rescueStock.models.ReleaseRecord;
import com.generated.rescueStock.models.SupplyItem;
import com.generated.rescueStock.models.Warehouse;
import com.generated.rescueStock.repositories.InventoryBatchMapper;
import com.generated.rescueStock.repositories.ReleaseRecordMapper;
import com.generated.rescueStock.repositories.SupplyItemMapper;
import com.generated.rescueStock.repositories.WarehouseMapper;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ReleaseRecordService {
  private final ReleaseRecordMapper releaseMapper;
  private final WarehouseMapper warehouseMapper;
  private final SupplyItemMapper itemMapper;
  private final InventoryBatchMapper batchMapper;

  public ReleaseRecordService(ReleaseRecordMapper releaseMapper, WarehouseMapper warehouseMapper,
                              SupplyItemMapper itemMapper, InventoryBatchMapper batchMapper) {
    this.releaseMapper = releaseMapper;
    this.warehouseMapper = warehouseMapper;
    this.itemMapper = itemMapper;
    this.batchMapper = batchMapper;
  }

  /** 最近放行记录：库存页展示，刷新后由数据库保证一致。 */
  public List<Map<String, Object>> recent(Long warehouseId, int limit) {
    QueryWrapper<ReleaseRecord> query = new QueryWrapper<>();
    if (warehouseId != null) query.eq("warehouse_id", warehouseId);
    query.orderByDesc("id").last("LIMIT " + Math.max(1, Math.min(limit, 50)));
    List<ReleaseRecord> records = releaseMapper.selectList(query);
    Map<Long, Warehouse> warehouses = warehouseMapper.selectList(null).stream()
        .collect(Collectors.toMap(w -> w.id, Function.identity()));
    Map<Long, SupplyItem> items = itemMapper.selectList(null).stream()
        .collect(Collectors.toMap(i -> i.id, Function.identity()));
    Map<Long, InventoryBatch> batches = batchMapper.selectList(null).stream()
        .collect(Collectors.toMap(b -> b.id, Function.identity()));
    return records.stream().map(record -> {
      Warehouse warehouse = warehouses.get(record.warehouseId);
      SupplyItem item = items.get(record.supplyItemId);
      InventoryBatch batch = batches.get(record.batchId);
      return ReleaseRecordDtoFactory.toResponse(record,
          warehouse == null ? "" : warehouse.name,
          item == null ? "" : item.name,
          batch == null ? "" : batch.batchNo);
    }).toList();
  }
}
