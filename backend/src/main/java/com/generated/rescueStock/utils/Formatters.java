package com.generated.rescueStock.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** 通用格式化：日期、状态文本、审计标识等，多处共用。 */
public final class Formatters {
  private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  private Formatters() {}

  public static String audit(String type, long id) { return type + "#" + id; }

  public static String dateTime(LocalDateTime value) {
    return value == null ? "" : DATE_TIME.format(value);
  }

  public static String blankToDefault(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }
}
