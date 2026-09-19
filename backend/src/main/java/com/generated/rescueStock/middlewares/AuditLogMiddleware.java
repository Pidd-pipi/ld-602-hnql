package com.generated.rescueStock.middlewares;

import com.generated.rescueStock.services.AuditLogService;
import com.generated.rescueStock.utils.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** 请求审计：非 GET 请求完成后补记一条 API 级日志（业务日志由 service 写）。 */
@Component
public class AuditLogMiddleware implements HandlerInterceptor {
  private final AuditLogService auditLogService;

  public AuditLogMiddleware(AuditLogService auditLogService) { this.auditLogService = auditLogService; }

  @Override
  public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
    if ("GET".equalsIgnoreCase(request.getMethod())) return;
    String actor = UserContext.get() == null ? "anonymous" : UserContext.get().userId();
    try {
      auditLogService.record(actor, "API " + request.getMethod() + " " + request.getRequestURI(),
          "HttpRequest", String.valueOf(response.getStatus()), "");
    } catch (Exception ignored) {
      // 审计失败不阻断主流程
    }
  }
}
