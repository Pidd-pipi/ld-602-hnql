package com.generated.rescueStock.types;

/** 批次入库请求 */
public record InboundPayload(
    Long warehouseId,
    Long supplyItemId,
    String batchNo,
    Integer quantity,
    String expireAt,
    String inboundSource,
    String qualityStatus
) {}
