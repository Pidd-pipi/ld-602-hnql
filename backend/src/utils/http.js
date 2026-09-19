import { ApiError } from './ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { errorMessage } from '../constants/errorMessages.js';

const MAX_BODY_BYTES = 1024 * 1024;

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new ApiError(413, ERROR_CODES.VALIDATION_ERROR, errorMessage(ERROR_CODES.VALIDATION_ERROR, 'body')));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new ApiError(400, ERROR_CODES.VALIDATION_ERROR, errorMessage(ERROR_CODES.VALIDATION_ERROR, 'body')));
      }
    });
    req.on('error', reject);
  });
}
