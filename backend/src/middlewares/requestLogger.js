/** 请求日志：方法、路径、状态码、耗时。 */
export function logRequest(req, res, startedAt) {
  const ms = Date.now() - startedAt;
  console.log(`[rescue-stock] ${req.method} ${req.url} -> ${res.statusCode} ${ms}ms`);
}
