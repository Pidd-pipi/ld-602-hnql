package com.generated.rescueStock.middlewares;

import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.constants.ErrorMessages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** 简单限流：每 IP 每分钟请求数上限。 */
@Component
public class RateLimitMiddleware implements HandlerInterceptor {
  private final int limitPerMinute;
  private final Map<String, Window> windows = new ConcurrentHashMap<>();

  public RateLimitMiddleware(@Value("${app.rate-limit-per-minute:120}") int limitPerMinute) {
    this.limitPerMinute = limitPerMinute;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    String key = request.getRemoteAddr();
    long minute = System.currentTimeMillis() / 60000L;
    Window window = windows.computeIfAbsent(key, k -> new Window(minute));
    int count = window.count(minute);
    if (count > limitPerMinute) {
      response.setStatus(429);
      response.setContentType("application/json;charset=UTF-8");
      response.getWriter().write("{\"code\":\"" + ErrorCodes.RATE_LIMITED
          + "\",\"message\":\"" + ErrorMessages.RATE_LIMITED + "\"}");
      return false;
    }
    return true;
  }

  private static final class Window {
    private long minute;
    private final AtomicInteger count = new AtomicInteger();

    Window(long minute) { this.minute = minute; }

    synchronized int count(long now) {
      if (now != minute) {
        minute = now;
        count.set(0);
      }
      return count.incrementAndGet();
    }
  }
}
