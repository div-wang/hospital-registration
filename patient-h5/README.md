# 患者挂号 H5

Vue 3 + TypeScript + Vite 单页应用，使用 Vue Router Hash 模式，支持 GitHub Pages 静态部署。

页面包括首页、医院和医生查询、医院/医生/科室详情、预约确认、预约列表与详情、个人中心、常见问题和投诉建议。

医院、科室、医生和排班允许匿名浏览；挂号、预约记录、取消预约和投诉建议需要手机号登录。

```bash
cp .env.example .env
npm install
npm run dev
```

通过 `VITE_API_BASE_URL` 配置后台服务的 `/api/v1` 地址。
