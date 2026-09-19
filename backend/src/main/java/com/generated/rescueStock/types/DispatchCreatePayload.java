package com.generated.rescueStock.types;

import java.util.List;

/** 调拨单创建请求 */
public record DispatchCreatePayload(
    Long eventId,
    Long sourceWarehouseId,
    Long shelterId,
    String priority,
    List<DispatchLinePayload> lines
) {}
