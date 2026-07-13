# 安康挂号

医院预约挂号小程序原型与配套后台服务。

## 项目结构

- `app/`：移动端挂号界面，Next.js + React
- `backend/`：Node.js + TypeScript + Express + MySQL 8 REST API
- `backend/migrations/`：MySQL 表结构与演示数据
- `.github/workflows/`：GitHub Pages 自动部署

## 前端

```bash
npm install
npm run dev
```

在线预览：<https://blog.div-wang.com/hospital-registration/>

## 后台

```bash
cd backend
docker compose up --build
```

API 默认运行于 `http://localhost:4000`，详细接口、配置和安全说明见 [`backend/README.md`](backend/README.md)。
