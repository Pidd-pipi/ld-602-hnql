package com.generated.rescueStock.types;

/** 业务异常：service 抛出，controller/全局异常处理器分别包装为错误响应。 */
public class BizException extends RuntimeException {
  private final String code;

  public BizException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String getCode() { return code; }
}
