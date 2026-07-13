# 医院挂号后台服务

独立的 Node.js + TypeScript + Express + MySQL 8 REST API。API 基础路径为 `/api/v1`。

## 快速启动

推荐使用 Docker：

```bash
docker compose up --build
```

启动后：

- API：`http://localhost:4000`
- 健康检查：`GET http://localhost:4000/health`
- MySQL：`127.0.0.1:3306`
- 开发短信验证码：`123456`

也可以手动启动：

```bash
cp .env.example .env
npm install
npm run dev
```

先执行 `migrations/001_initial_schema.sql`，需要演示数据时再执行 `002_seed_demo_data.sql`。

## 认证

登录成功后使用请求头：

```text
Authorization: Bearer <accessToken>
```

开发环境仅使用 `.env` 中的 `DEV_SMS_CODE`。生产环境默认拒绝登录，必须在 `src/services/auth.ts` 中接入真实短信服务后才能启用，避免测试验证码进入生产。

## API

### 登录

`POST /api/v1/auth/mobile-login`

```json
{ "mobile": "13800138000", "verificationCode": "123456" }
```

手机号不存在时在同一事务中自动创建用户，然后返回 JWT。手机号已存在时直接更新最后登录时间。

### 绑定第三方账号（预留）

`POST /api/v1/auth/third-party/bind`，需要登录，目前返回 `501 NOT_IMPLEMENTED`。

### 医院

- `GET /api/v1/hospitals?keyword=协和&province=北京市&city=北京市&district=东城区&level=三级甲等&page=1&pageSize=20`
- `GET /api/v1/hospitals/:id`

### 科室

- `GET /api/v1/departments?hospitalId=1&keyword=皮肤&page=1&pageSize=20`
- `GET /api/v1/departments/:id`

### 医生

- `GET /api/v1/doctors?keyword=涂&hospitalId=2&departmentId=2&title=主任医师&page=1&pageSize=20`
- `GET /api/v1/doctors/:id`

### 挂号人

全部接口需要登录。每个用户最多 10 个未删除的挂号人。

- `GET /api/v1/registration-people?keyword=张&sort=asc`
- `POST /api/v1/registration-people`
- `PATCH /api/v1/registration-people/:id`
- `DELETE /api/v1/registration-people/:id`

新增示例：

```json
{
  "name": "张三",
  "mobile": "13800138000",
  "idCard": "110101199001011234",
  "relationship": "self",
  "isDefault": true
}
```

身份证号使用 AES-256-GCM 加密保存，同时保存不可逆哈希用于防重复；列表只返回掩码。

### 挂号订单

- `POST /api/v1/registrations`
- `GET /api/v1/registrations?status=pending_payment&page=1&pageSize=20`
- `GET /api/v1/registrations/:id`

创建挂号：

```json
{
  "registrationPersonId": 1,
  "hospitalId": 2,
  "departmentId": 2,
  "doctorId": 2,
  "visitDate": "2026-07-20",
  "timePeriod": "08:30-09:00"
}
```

服务会验证挂号人归属，以及医院、科室、医生之间的真实关联关系，并在订单内保存姓名、手机号、身份证、医院、科室、医生及费用快照。

## 数据表

| 表 | 用途 |
| --- | --- |
| `users` | 手机号用户 |
| `user_third_party_accounts` | 微信、千问等第三方身份绑定 |
| `registration_people` | 用户的挂号人，最多 10 个 |
| `hospitals` | 医院及地域、等级信息 |
| `departments` | 医院科室，支持父子科室 |
| `doctors` | 医生、职称、擅长和挂号费 |
| `registration_orders` | 挂号订单与业务快照 |
| `payments` | 支付单和第三方交易信息 |

## 生产环境注意事项

- 接入真实短信验证码服务，并增加发送频率限制与验证码过期时间。
- `JWT_SECRET` 和 `DATA_ENCRYPTION_KEY` 必须由密钥管理系统提供，禁止提交到仓库。
- 数据库账号仅授予当前数据库所需权限；生产环境不要使用 root。
- 身份证等敏感字段的日志必须脱敏，数据库备份也需要加密。
- 挂号号源、库存占用、取消订单和支付回调应作为下一阶段独立模块实现。
