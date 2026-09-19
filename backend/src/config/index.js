import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * 全局配置集中入口。所有项均可被环境变量覆盖，
 * 测试通过 createServer(options) 显式注入同名字段。
 */
export const config = {
  port: Number(process.env.PORT || 21102),
  host: process.env.HOST || '0.0.0.0',
  // 数据落盘文件：库存与放行记录的持久化来源，保证“刷新后一致”。
  dataFile: process.env.DATA_FILE || path.join(backendRoot, 'data', 'rescue-stock.json'),
  // 临期阈值：距到期日 ≤ 该天数且质检合格、未过期的批次记为“临期”。
  nearExpiryDays: Number(process.env.NEAR_EXPIRY_DAYS || 30),
  publicDir: process.env.PUBLIC_DIR || path.join(backendRoot, 'public'),
};
