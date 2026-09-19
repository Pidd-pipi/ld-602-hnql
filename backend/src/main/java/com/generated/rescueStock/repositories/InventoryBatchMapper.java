package com.generated.rescueStock.repositories;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.generated.rescueStock.models.InventoryBatch;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface InventoryBatchMapper extends BaseMapper<InventoryBatch> {

  /**
   * 并发安全的原子扣减：仅当批次合格、未过期且余量充足时才扣减。
   * 返回 0 表示申领失败（被并发调拨抢先 / 已冻结 / 余量不足），
   * 调用方必须抛出异常回滚事务，保证失败方不改变库存。
   */
  @Update("UPDATE inventory_batch SET quantity = quantity - #{quantity} "
      + "WHERE id = #{id} AND quantity >= #{quantity} "
      + "AND quality_status = 'QUALIFIED' AND expire_at > NOW()")
  int deductDispatchable(@Param("id") Long id, @Param("quantity") int quantity);

  /** 可调拨量 = 合格且未过期数量之和（待检/不合格/已过期不计入） */
  @Select("SELECT COALESCE(SUM(quantity), 0) FROM inventory_batch "
      + "WHERE warehouse_id = #{warehouseId} AND supply_item_id = #{itemId} "
      + "AND quality_status = 'QUALIFIED' AND expire_at > NOW()")
  int sumDispatchable(@Param("warehouseId") Long warehouseId, @Param("itemId") Long itemId);
}
