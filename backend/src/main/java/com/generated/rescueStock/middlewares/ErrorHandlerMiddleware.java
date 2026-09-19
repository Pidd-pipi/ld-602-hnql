package com.generated.rescueStock.middlewares;

import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.constants.ErrorMessages;
import com.generated.rescueStock.types.BizException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** 全局异常包装：BizException 按错误码映射状态码，未知异常兜底 500。 */
@RestControllerAdvice
public class ErrorHandlerMiddleware {
  private static final Logger log = LoggerFactory.getLogger(ErrorHandlerMiddleware.class);

  @ExceptionHandler(BizException.class)
  public ResponseEntity<Map<String, String>> biz(BizException ex) {
    HttpStatus status = switch (ex.getCode()) {
      case ErrorCodes.BATCH_NOT_FOUND, ErrorCodes.DISPATCH_NOT_FOUND -> HttpStatus.NOT_FOUND;
      case ErrorCodes.VALIDATION_FAILED, ErrorCodes.REASON_REQUIRED -> HttpStatus.BAD_REQUEST;
      case ErrorCodes.CONCURRENT_CLAIM_FAILED, ErrorCodes.INSUFFICIENT_STOCK,
           ErrorCodes.BATCH_NOT_DISPATCHABLE, ErrorCodes.DISPATCH_NOT_ACTIONABLE -> HttpStatus.CONFLICT;
      default -> HttpStatus.UNPROCESSABLE_ENTITY;
    };
    return ResponseEntity.status(status).body(Map.of("code", ex.getCode(), "message", ex.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> fallback(Exception ex) {
    log.error("unhandled error", ex);
    return ResponseEntity.status(500)
        .body(Map.of("code", ErrorCodes.INTERNAL_ERROR, "message", ErrorMessages.INTERNAL_ERROR));
  }
}
