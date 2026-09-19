package com.generated.rescueStock.middlewares;

import com.generated.rescueStock.constants.ErrorCodes;
import com.generated.rescueStock.constants.ErrorMessages;
import com.generated.rescueStock.constants.Role;
import com.generated.rescueStock.utils.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** 认证：写操作必须携带 X-User-Id / X-User-Role 头，并写入 UserContext。 */
@Component
public class AuthMiddleware implements HandlerInterceptor {
  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    String userId = request.getHeader("X-User-Id");
    String roleHeader = request.getHeader("X-User-Role");
    Role role = Role.VIEWER;
    if (roleHeader != null) {
      try {
        role = Role.valueOf(roleHeader);
      } catch (IllegalArgumentException ignored) {
        role = Role.VIEWER;
      }
    }
    if (userId == null || userId.isBlank()) {
      if ("GET".equalsIgnoreCase(request.getMethod())) {
        UserContext.set(new UserContext.CurrentUser("readonly", role));
        return true;
      }
      response.setStatus(401);
      response.setContentType("application/json;charset=UTF-8");
      response.getWriter().write("{\"code\":\"" + ErrorCodes.AUTH_REQUIRED
          + "\",\"message\":\"" + ErrorMessages.AUTH_REQUIRED + "\"}");
      return false;
    }
    UserContext.set(new UserContext.CurrentUser(userId, role));
    return true;
  }

  @Override
  public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
    UserContext.clear();
  }
}
