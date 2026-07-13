# 安康医院挂号平台

项目已按部署边界拆分为三个相互独立的子系统。仓库根目录只保留说明文档、Git 配置和 CI 等全局文件。

| 子系统 | 目录 | 技术栈 | 用途 |
| --- | --- | --- | --- |
| 后台服务 | `backend-service/` | Node.js、TypeScript、Express、MySQL 8 | 为 H5、小程序、App 和医院后台提供 REST API |
| 医院后台 | `hospital-admin/` | React、TypeScript、Vite | 医院、科室、医生、排班和账户管理 |
| 患者挂号 H5 | `patient-h5/` | Next.js、React | 原有患者端挂号页面（页面代码未修改） |

## 本地运行

### 后台服务

```bash
cd backend-service
docker compose up --build
```

API 默认地址为 `http://localhost:4000`。数据库结构、接口和权限说明见 [`backend-service/README.md`](backend-service/README.md)。

### 医院后台管理

```bash
cd hospital-admin
npm install
npm run dev
```

### 患者挂号 H5

```bash
cd patient-h5
npm install
npm run dev
```

患者 H5 在线预览：<https://blog.div-wang.com/hospital-registration/>。推送到 `main` 后，GitHub Actions 只构建并发布 `patient-h5/`。
