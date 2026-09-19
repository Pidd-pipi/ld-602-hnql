# 城市防灾应急物资调度系统

面向街道、社区和应急仓库的防灾物资储备与调拨平台，覆盖物资库存、避难点、事件响应和调拨审批，核心为**临期物资管控闭环**：批次入库后按到期日与质检状态区分可用 / 临期 / 冻结，调拨审批受安全库存与并发控制约束，全程留痕。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20102>

后端健康检查：<http://localhost:21102/health>

```bash
# 查看批次三态（可用/临期/冻结）
curl http://localhost:21102/api/inventory-batch
# 查看库存三类数量汇总
curl http://localhost:21102/api/inventory-batch/summary
# 审批放行（需审批员角色头）
curl -X POST http://localhost:21102/api/dispatch-order/1/approve \
  -H 'Content-Type: application/json' -H 'X-User-Id: u2001' -H 'X-User-Role: APPROVER' \
  -d '{"reason":"应急供水"}'
```

## 临期物资管控闭环规则

1. **批次三态**：批次按到期日与质检状态归入 可用（合格且效期充裕）/ 临期（合格但 30 天内到期，阈值见 `NEAR_EXPIRE_DAYS`）/ 冻结（待检、不合格或已过期）。
2. **可调拨量**：仅 可用 + 临期；待检、不合格、已过期数量一律不得进入可调拨量，创建调拨时冻结批次直接拒绝。
3. **安全库存**：普通调拨扣减后任一物资低于安全库存 → 整单置 `REJECTED`，不扣任何库存；应急调拨由审批员填写原因后放行，可突破安全库存。
4. **并发控制**：扣减走原子 SQL（`UPDATE ... WHERE quantity >= ? AND quality_status='QUALIFIED' AND expire_at > NOW()`），并发申领同一批次只成功一单，失败方事务回滚、库存不变。
5. **库存页一致性**：库存页展示三类数量与最近放行记录（`release_record` 流水），数据全部落库，刷新后一致。

## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后执行 `mvn spring-boot:run`（需本地 MySQL，按 `backend/src/main/resources/application.yml` 配置环境变量），接口统一挂在 `/api`。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia + ECharts |
| 后端 | Spring Boot 3 + Java 17 + MyBatis-Plus |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/main/java/com/generated/rescueStock/{routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config}
database/init.sql  # 建表 + 种子数据（到期日相对当前时间生成，三态分布稳定）
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `rescue-stock`
- `FRONTEND_PORT`: 前端端口，默认 `20102`
- `BACKEND_PORT`: 后端端口，默认 `21102`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据
- `NEAR_EXPIRE_DAYS`: 临期阈值（天），默认 `30`，经 `application.yml` → `InventoryBatchService` 生效
- `RATE_LIMIT_PER_MINUTE`: 限流阈值，默认 `120`，经 `application.yml` → `RateLimitMiddleware` 生效

## 认证与角色

请求头 `X-User-Id` + `X-User-Role`（`ADMIN` / `APPROVER` / `WAREHOUSE_KEEPER` / `VIEWER`），前端右上角可切换角色：

- 放行 / 驳回：仅 `APPROVER`、`ADMIN`
- 批次入库 / 质检：`WAREHOUSE_KEEPER` 及以上
- 查询：全部角色；只读观察员的写操作被 `RbacMiddleware` 拦截

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: rescue-stock`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-rescue-stock}` 前缀。
- 数据库使用命名卷 `db_data`，避免绑定中文路径；`database/init.sql` 首次启动自动执行。
- 数据库配置 healthcheck，后端 `depends_on: condition: service_healthy` 等待；后端 `/health` 健康检查通过后前端才启动。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- SupplyCategory: `constants/SupplyCategory`、`types/SupplyCategory`、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用（前后端各一份）。
- DispatchStatus: `constants/DispatchStatus`、`types/DispatchStatus`、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用（前后端各一份）。
- ShelterStatus: `constants/ShelterStatus`、`types/ShelterStatus`、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用（前后端各一份）。
- QualityStatus（PENDING_QC/QUALIFIED/UNQUALIFIED）: `backend/constants/QualityStatus.java`、`frontend/constants/QualityStatus.ts`、`frontend/types/QualityStatus.ts`、`InventoryBatchMapper` 原子扣减 SQL、`InventoryBatchService`、`StatusBadge`、入库/质检表单。
- DispatchPriority（NORMAL/EMERGENCY）: `backend/constants/DispatchPriority.java`、`frontend/constants/DispatchPriority.ts`、`frontend/types/DispatchPriority.ts`、`DispatchOrderService`（安全库存校验分支）、调拨创建表单、审批对话框。
- BatchBucket（AVAILABLE/NEAR_EXPIRY/FROZEN）: `backend/constants/BatchBucket.java`、`frontend/constants/BatchBucket.ts`、`frontend/types/BatchBucket.ts`、`InventoryBatchDtoFactory`、`StockSummaryDtoFactory`、`BatchTable`、`useExpireWarning`、库存页筛选器。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。例如新增一种质检状态，需要同时改动：后端 `QualityStatus` 枚举、`BatchBucket` 归类、`InventoryBatchMapper` 扣减 SQL、前端 `constants/QualityStatus.ts` 与 `types/QualityStatus.ts`、`StatusBadge` 色调映射、库存页筛选与种子数据。

## License

MIT
