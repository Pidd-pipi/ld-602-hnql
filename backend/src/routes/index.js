/** 路由表 + 简易模式匹配（支持 :param）。 */
import { createInventoryController } from '../controllers/InventoryController.js';
import { createDispatchController } from '../controllers/DispatchController.js';
import { requireRole } from '../middlewares/rbac.js';
import { sendJson } from '../utils/http.js';

function compile(pattern) {
  const segments = pattern.split('/').filter(Boolean);
  return (pathname) => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length !== segments.length) return null;
    const params = {};
    for (let i = 0; i < segments.length; i += 1) {
      if (segments[i].startsWith(':')) params[segments[i].slice(1)] = decodeURIComponent(parts[i]);
      else if (segments[i] !== parts[i]) return null;
    }
    return params;
  };
}

export function buildRouter({ store, inboundService, dispatchService, nearExpiryDays, now }) {
  const inventory = createInventoryController({ store, inboundService, dispatchService, nearExpiryDays, now });
  const dispatch = createDispatchController({ dispatchService });

  const routes = [
    { method: 'GET', pattern: '/health', handler: (ctx) => sendJson(ctx.res, 200, { status: 'ok', service: 'rescue-stock' }) },
    { method: 'GET', pattern: '/api/meta', handler: inventory.meta },
    { method: 'POST', pattern: '/api/batches', handler: inventory.inbound },
    { method: 'GET', pattern: '/api/inventory', handler: inventory.inventory },
    { method: 'GET', pattern: '/api/releases', handler: inventory.releases },
    { method: 'POST', pattern: '/api/dispatch/claim', handler: dispatch.claim },
    { method: 'POST', pattern: '/api/dispatch/emergency', handler: dispatch.submitEmergency },
    // 应急放行：仅审批员/管理员角色可操作
    { method: 'POST', pattern: '/api/dispatch/:id/release', handler: requireRole(['approver', 'admin'], dispatch.release) },
    { method: 'GET', pattern: '/api/dispatch', handler: dispatch.list },
  ].map((r) => ({ ...r, match: compile(r.pattern) }));

  return {
    match(method, pathname) {
      for (const route of routes) {
        if (route.method !== method) continue;
        const params = route.match(pathname);
        if (params) return { handler: route.handler, params };
      }
      return null;
    },
  };
}
