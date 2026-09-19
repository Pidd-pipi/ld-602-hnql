import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createStore } from './repositories/store.js';
import { createMutex } from './utils/mutex.js';
import { createInboundService } from './services/InboundService.js';
import { createDispatchService } from './services/DispatchService.js';
import { buildRouter } from './routes/index.js';
import { readJsonBody } from './utils/http.js';
import { sendError } from './middlewares/errorHandler.js';
import { logRequest } from './middlewares/requestLogger.js';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(publicDir, pathname, res) {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(publicDir, rel);
  if (!file.startsWith(path.resolve(publicDir) + path.sep)) return false;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  res.writeHead(200, { 'content-type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
  return true;
}

/**
 * 组装应用：仓储（JSON 持久化）→ 服务（互斥锁串行化写操作）→ 路由 → HTTP。
 * options 与 config 同构，测试可注入临时数据文件与端口 0。
 */
export async function createServer(options = {}) {
  const {
    port = 21102,
    host = '0.0.0.0',
    dataFile,
    publicDir = path.resolve(process.cwd(), 'public'),
    nearExpiryDays = 30,
    seedState,
  } = options;

  const store = createStore({ file: dataFile, seedState });
  const mutex = createMutex();
  const now = () => Date.now();
  const inboundService = createInboundService({ store, mutex, now });
  const dispatchService = createDispatchService({ store, mutex, nearExpiryDays, now });
  const router = buildRouter({ store, inboundService, dispatchService, nearExpiryDays, now });

  const server = http.createServer(async (req, res) => {
    const startedAt = Date.now();
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type,x-role,x-actor');
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      const url = new URL(req.url, 'http://localhost');
      const matched = router.match(req.method, url.pathname);
      if (matched) {
        const body = req.method === 'POST' || req.method === 'PUT' ? await readJsonBody(req) : {};
        await matched.handler({
          req,
          res,
          params: matched.params,
          query: url.searchParams,
          body,
          role: req.headers['x-role'] || 'viewer',
          actor: req.headers['x-actor'] || body.approved_by || body.requested_by || null,
        });
        return;
      }
      if ((req.method === 'GET' || req.method === 'HEAD') && serveStatic(publicDir, url.pathname, res)) return;
      res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: `路由 ${url.pathname} 不存在`, details: null } }));
    } catch (err) {
      sendError(res, err);
    } finally {
      logRequest(req, res, startedAt);
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  return {
    server,
    store,
    port: address.port,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
