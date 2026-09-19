/** 统一错误响应：ApiError → 状态码 + 业务错误码；未知异常 → 500。 */
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { errorMessage } from '../constants/errorMessages.js';
import { sendJson } from '../utils/http.js';

export function sendError(res, err) {
  if (err instanceof ApiError) {
    sendJson(res, err.status, { error: { code: err.code, message: err.message, details: err.details ?? null } });
    return;
  }
  console.error('[rescue-stock] unhandled error:', err);
  sendJson(res, 500, {
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: errorMessage(ERROR_CODES.INTERNAL_ERROR), details: null },
  });
}
