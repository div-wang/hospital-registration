# 医院后台管理系统

独立的 React + TypeScript + Vite 管理端，覆盖医院、科室、医生、医生排班、账户充值与资金流水页面。

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_BASE_URL` 指向 `backend-service` 的 `/api/v1`。API 客户端会为受保护请求自动添加 `platform: h5` 和本地保存的 Bearer Token。
