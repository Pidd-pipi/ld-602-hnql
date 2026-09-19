import { config } from './config/index.js';
import { createServer } from './server.js';

const app = await createServer(config);

console.log(`[rescue-stock] 临期物资管控闭环后端已启动: http://${config.host}:${app.port}`);
console.log(`[rescue-stock] 库存页: http://localhost:${app.port}/  数据文件: ${config.dataFile}`);
console.log(`[rescue-stock] 临期阈值: ${config.nearExpiryDays} 天（NEAR_EXPIRY_DAYS 可配置）`);
