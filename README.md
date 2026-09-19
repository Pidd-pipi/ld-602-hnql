# 城市防灾应急物资调度系统

面向街道、社区和应急仓库的防灾物资储备与调拨平台，覆盖物资库存、避难点、事件响应和调拨审批。

## 临期物资管控闭环（当前已实现的可运行切片）

闭环后端位于 `backend/src`（Node.js ≥ 20，零外部依赖，开箱即跑），库存页由后端直接托管。

```bash
# 启动（默认端口 21102，首次启动自动写入种子数据）
node backend/src/index.js
# 或
npm --prefix backend start

# 运行业务闭环测试（6 个用例覆盖全部规则）
npm --prefix backend test
```

- 库存页：<http://localhost:21102/>（三类数量 + 最近放行记录 + 入库/申领/应急放行操作台，5s 自动刷新）
- 健康检查：<http://localhost:21102/health>

### 闭环规则

1. **批次入库分区**：入库后按到期日与质检状态派生分区——`可用`（合格未临期）、`临期`（合格且距到期 ≤ `NEAR_EXPIRY_DAYS`，默认 30 天）、`冻结`（待检 / 不合格 / 已过期）。
2. **可调拨量**：仅 `可用 + 临期`；待检、不合格、已过期数量一律不进入可调拨量，冻结批次申领返回 `BATCH_NOT_TRANSFERABLE`。
3. **普通调拨**：`POST /api/dispatch/claim`，调拨后任一物资可调拨量低于其安全库存 → 整单拒绝（`SAFETY_STOCK_VIOLATION`，库存不变、不产生放行记录）。
4. **应急调拨**：`POST /api/dispatch/emergency` 登记（不动库存）→ 审批员携带原因 `POST /api/dispatch/:id/release` 放行（请求头 `x-role: approver`，缺原因 400、非审批员 403），应急放行不受安全库存限制。
5. **并发申领**：所有库存写操作在进程内互斥锁中串行执行，"校验 + 扣减"原子完成——同一批次并发申领只能成功一单，失败方返回 `INSUFFICIENT_STOCK` 且库存不变。
6. **库存页一致性**：每次写操作同步落盘 JSON（tmp + rename 原子替换），页面刷新 / 服务重启后三类数量与最近放行记录一致。

### API 一览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查 |
| GET | `/api/meta` | 仓库/物资/安置点/枚举文案 |
| POST | `/api/batches` | 批次入库（warehouse_id, supply_item_id, batch_no, quantity, expire_at, quality_status, inbound_source） |
| GET | `/api/inventory?warehouse_id=` | 库存视图：可用/临期/冻结/可调拨量 + 批次分区明细 |
| GET | `/api/releases?warehouse_id=&limit=` | 最近放行记录（倒序） |
| POST | `/api/dispatch/claim` | 普通调拨申领（安全库存约束，整单拒绝） |
| POST | `/api/dispatch/emergency` | 应急调拨登记（不动库存） |
| POST | `/api/dispatch/:id/release` | 应急放行（需 `x-role: approver` + `approve_reason`） |
| GET | `/api/dispatch` | 调拨单列表 |

### 后端目录（本切片）

```text
backend/src/
├── config/         # 端口、数据文件、临期阈值（env 可覆盖）
├── constants/      # QualityStatus / BatchBucket / DispatchStatus / DispatchPriority / 错误码 / 错误消息 / 日志模板
├── constructors/   # 批次、调拨单、放行记录、审计日志构造器
├── repositories/   # JSON 持久化仓储 + 种子数据
├── services/       # InventoryService（分区/聚合）/ InboundService（入库）/ DispatchService（申领/放行闭环）
├── controllers/    # 库存域、调拨域控制器
├── middlewares/    # errorHandler / rbac / requestLogger
├── routes/         # 路由表
├── utils/          # 互斥锁、校验、HTTP 助手、ApiError
└── server.js       # 装配：仓储 → 服务 → 路由 → HTTP + 静态库存页
backend/test/       # 闭环测试（node --test）
backend/public/       # 库存页（原生 HTML/JS，无需构建）
```

> 说明：`backend/src/main/java` 下的 Spring Boot 骨架与 `frontend/` 的 Vue 骨架为全量项目预留结构，本环境（无 JDK/Docker）中未改动；上述 Node 切片是独立可运行的完整闭环。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20102>

后端健康检查：<http://localhost:21102/health>


## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


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
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `rescue-stock`
- `FRONTEND_PORT`: 前端端口，默认 `20102`
- `BACKEND_PORT`: 后端端口，默认 `21102`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: rescue-stock`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-rescue-stock}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- SupplyCategory: constants/SupplyCategory、types/SupplyCategory、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- DispatchStatus: constants/DispatchStatus、types/DispatchStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- ShelterStatus: constants/ShelterStatus、types/ShelterStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
