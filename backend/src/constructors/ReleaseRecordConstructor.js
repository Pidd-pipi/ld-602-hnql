/** 放行记录构造器：每次实际扣减库存的放行（普通/应急）都落一条，供库存页“最近放行记录”展示。 */
export function createReleaseRecord({
  id,
  order_id,
  priority,
  warehouse_id,
  shelter_id,
  supply_item_id,
  batch_id,
  batch_no,
  quantity,
  actor,
  reason,
  released_at,
}) {
  return {
    id,
    order_id,
    priority,
    warehouse_id,
    shelter_id,
    supply_item_id,
    batch_id,
    batch_no,
    quantity,
    actor,
    reason,
    released_at,
  };
}
