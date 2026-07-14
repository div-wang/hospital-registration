# 医院挂号后台服务

独立部署的 Node.js + TypeScript + Express + MySQL 8 REST API，基础路径为 `/api/v1`。

## 启动

```bash
docker compose up --build
```

- API：`http://localhost:4000`
- 健康检查：`GET /health`
- MySQL：`127.0.0.1:3306`
- 开发验证码：由 `.env` 的 `DEV_SMS_CODE` 配置

手动启动时先复制 `.env.example`，并依次执行 `migrations/001_initial_schema.sql` 和可选的 `002_seed_demo_data.sql`。

也可以执行：

```bash
npm run db:migrate
npm run db:seed
```

数据库账号至少需要目标数据库的 `CREATE`、`ALTER`、`INDEX`、`SELECT`、`INSERT`、`UPDATE` 和 `DELETE` 权限。

## 访问控制

健康检查、发送短信和手机号登录在白名单中；医院、科室、医生和排班的 GET 接口允许匿名浏览。其他接口需要登录。除健康检查和登录白名单外，请求均需携带 `platform`：

```text
Authorization: Bearer <accessToken>
platform: h5 | miniprogram | app
```

缺少、无效或过期的认证信息统一返回 `403`。角色包括 `user`、`merchant_admin`、`merchant_staff`、`super_admin`；商户角色还会校验 `hospital_members` 中的医院归属。

## API 概览

- 认证：`POST /auth/send-sms`、`POST /auth/mobile-login`、`POST /auth/third-party/bind`（预留）
- 医院：`GET/POST /hospitals`、`GET/PATCH/DELETE /hospitals/:id`
- 科室：`GET/POST /departments`、`GET/PATCH/DELETE /departments/:id`
- 医生：`GET/POST /doctors`、`GET/PATCH/DELETE /doctors/:id`
- 排班：`GET/POST /schedules`、`PATCH/DELETE /schedules/:id`；列表默认过滤过期排班
- 挂号人：`GET/POST /registration-people`、`PATCH/DELETE /registration-people/:id`；每个用户最多 10 人
- 挂号：`POST /registrations`、`GET /registrations`、`GET /registrations/:id`
- 账户：`GET /accounts/:hospitalId`、`POST /accounts/:hospitalId/recharge`、`GET /accounts/:hospitalId/flows`

手机号登录请求示例：

```json
{ "phone": "13800138000", "verificationCode": "123456" }
```

创建挂号人使用 `name`、`phone`、`idCard`、`relationship` 和 `isDefault`。身份证使用 AES-256-GCM 加密保存，同时保存不可逆哈希防止重复。

创建挂号必须提供 `registrationPersonId`、`hospitalId`、`departmentId`、`doctorId`、`scheduleId`，可选 `symptoms`。接口在事务中锁定排班记录、检查剩余号源并递增预约数，避免并发超卖。

## 数据模型

核心表包括用户、短信验证码、第三方账号、医院成员、挂号人、医院、科室、医生、医生排班、挂号订单、医院账户和支付流水。支付流水覆盖充值、冻结、解冻、消费、退款、提现和调整，并保留操作前后的余额快照。

## 生产注意事项

- 生产环境必须接入真实短信供应商；未配置时发送短信接口返回 `503`。
- `JWT_SECRET` 与 `DATA_ENCRYPTION_KEY` 应由密钥管理服务提供。
- 身份证、手机号等敏感数据的日志和备份需要脱敏或加密。
- 充值接口目前是管理端手工入账模型，接入微信/支付宝后应以签名回调作为最终入账依据。
