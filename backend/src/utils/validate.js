import { ApiError } from './ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { errorMessage } from '../constants/errorMessages.js';

export function validationError(field) {
  return new ApiError(400, ERROR_CODES.VALIDATION_ERROR, errorMessage(ERROR_CODES.VALIDATION_ERROR, field));
}

export function requirePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw validationError(field);
  return n;
}

export function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw validationError(field);
  return value.trim();
}

export function requireISODate(value, field) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw validationError(field);
  return new Date(value).toISOString();
}

export function requireEnum(value, allowed, field) {
  if (!allowed.includes(value)) throw validationError(field);
  return value;
}
