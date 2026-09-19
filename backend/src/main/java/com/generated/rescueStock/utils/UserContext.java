package com.generated.rescueStock.utils;

import com.generated.rescueStock.constants.Role;

/** 当前请求用户上下文（由 AuthMiddleware 写入）。 */
public final class UserContext {
  public record CurrentUser(String userId, Role role) {}

  private static final ThreadLocal<CurrentUser> HOLDER = new ThreadLocal<>();

  private UserContext() {}

  public static void set(CurrentUser user) { HOLDER.set(user); }

  public static CurrentUser get() { return HOLDER.get(); }

  public static String actor() {
    CurrentUser user = HOLDER.get();
    return user == null ? "anonymous" : user.userId();
  }

  public static void clear() { HOLDER.remove(); }
}
