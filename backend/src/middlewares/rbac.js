/** 简易 RBAC：应急放行等敏感操作要求请求头 x-role 具备指定角色（审批员/管理员）。 */
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { errorMessage } from '../constants/errorMessages.js';

export function requireRole(roles, handler) {
  return async (ctx) => {
    if (!roles.includes(ctx.role)) {
      throw new ApiError(403, ERROR_CODES.FORBIDDEN, errorMessage(ERROR_CODES.FORBIDDEN));
    }
    return handler(ctx);
  };
}
