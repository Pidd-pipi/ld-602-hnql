package com.generated.rescueStock.middlewares;

import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.constants.ErrorMessages;
import com.generated.rescueStock.constants.Role;
import com.generated.rescueStock.utils.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * RBAC：放行/驳回仅审批员与管理员；入库/质检需仓库员及以上；其余写操作拒绝只读观察员。
 */
@Component
public class RbacMiddleware implements HandlerInterceptor {
  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    if ("GET".equalsIgnoreCase(request.getMethod())) return true;
    UserContext.CurrentUser user = UserContext.get();
    Role role = user == null ? Role.VIEWER : user.role();
    String path = request.getRequestURI();
    boolean allowed;
    if (path.matches(".*/api/dispatch-order/\\d+/(approve|reject)$")) {
      allowed = role == Role.APPROVER || role == Role.ADMIN;
    } else if (path.startsWith("/api/inventory-batch")) {
      allowed = role == Role.WAREHOUSE_KEEPER || role == Role.ADMIN;
    } else {
      allowed = role != Role.VIEWER;
    }
    if (allowed) return true;
    response.setStatus(403);
    response.setContentType("application/json;charset=UTF-8");
    response.getWriter().write("{\"code\":\"" + ErrorCodes.RBAC_DENIED
        + "\",\"message\":\"" + ErrorMessages.RBAC_DENIED + "\"}");
    return false;
  }
}
