# MonitorBot 监控展示与后台管理系统 (Project Manifest & Guide)

> 本项目基于开源项目 [TRpAI/monitor-bot](https://github.com/TRpAI/monitor-bot) 进行全栈重构与增强，构建了一套集 **全球服务器遥测展示大屏**、**HTTP/TCP 探针监控**、**故障排查事件时间线**、**Telegram Bot 数据同步与告警中心** 以及 **多平台一键部署 (Cloudflare / Docker / VPS)** 于一体的生产级 DevOps 运维系统。

---

## 📁 项目完整目录结构说明

```
.
├── Dockerfile                  # 多阶段 Alpine 容器化镜像构建配置（内建安全非 root 用户与健康检查）
├── docker-compose.yml          # Docker 一键编排定义（暴露 3000 端口并持久化数据卷）
├── wrangler.toml               # Cloudflare Pages 边缘网络静态分发配置
├── public/
│   └── _redirects              # Cloudflare Pages SPA 路由重写规则
├── functions/
│   └── api/[[route]].ts        # Cloudflare Pages Functions 原生边缘函数 API 处理程序
├── ecosystem.config.cjs        # PM2 集群常驻进程守护配置
├── nginx.conf.example          # Nginx 反向代理模板（含 WebSocket 升级与真实 IP 透传）
├── deploy.sh                   # Linux VPS 一键自动化安装与构建脚本
├── package.json                # 依赖声明与 npm scripts (dev, build, start, lint)
├── tsconfig.json               # TypeScript 严格模式编译器配置
├── vite.config.ts              # Vite 构建与 TailwindCSS v4 插件配置
├── server.ts                   # Express 全栈后端核心服务（API、TG Bot 同步、Agent 上报、ZIP 打包下载）
├── index.html                  # 前端 HTML5 单页应用入口
├── metadata.json               # 平台应用元数据与权限定义
├── .env.example                # 生产与开发环境变量模板文件
├── .gitignore                  # Git 忽略规则
├── README.md                   # 项目中文部署与使用说明书
├── PROJECT_INFO.md             # 本文件：系统架构说明与全量项目信息清单
└── src                         # 前端 React 19 + TypeScript 源码目录
    ├── main.tsx                # React DOM 渲染入口
    ├── App.tsx                 # 主视图调度（前台大屏与管理后台切换）
    ├── index.css               # Tailwind CSS 全局样式与 JetBrains Mono / Plus Jakarta Sans 字体
    ├── types.ts                # 核心 TypeScript 类型定义 (Node, WebService, Incident, TelegramConfig 等)
    ├── api.ts                  # RESTful API 客户端请求封装
    ├── mockData.ts             # 初始预设示范节点、服务端点与事件日志
    └── components              # 模块化组件
        ├── Header.tsx          # 顶部常驻导航栏（含打包下载、自动刷新周期、前后台切换）
        ├── StatusBanner.tsx    # 全局态势指示横幅（在线率、平均延迟、90天可用率）
        ├── NodeList.tsx        # 服务器节点网格/列表矩阵（含 CPU、内存、网络上下行、温度探针）
        ├── NodeDetailModal.tsx # 节点深度遥测弹窗（负载曲线、规格详情、Agent 上报指引）
        ├── ServiceList.tsx     # HTTP/TCP 端点 90 天可用率条形图与即时健康检测
        ├── IncidentSection.tsx # 系统事件进展与历史维护公告时间线
        ├── DownloadModal.tsx   # 一键打包下载全部文件与项目信息弹窗
        ├── AdminLoginModal.tsx # 后台管理安全密钥鉴权弹窗 (默认密钥: admin123)
        ├── Footer.tsx          # 底部信息栏（含快捷操作、部署徽标与 GitHub 链接）
        └── admin               # 后台管理专有组件
            ├── AdminDashboard.tsx  # 管理后台主工作台（概览、TG集成、节点管理、服务配置、事件发布、备份）
            └── DeploymentGuide.tsx # Cloudflare / Docker / VPS / Agent 交互式部署指南
```

---

## ⚙️ 环境变量说明 (`.env.example`)

| 变量名 | 默认值 / 示例 | 说明 |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | 运行环境模式 (`development` 或 `production`) |
| `PORT` | `3000` | 服务端监听端口（固定为 3000） |
| `TELEGRAM_BOT_TOKEN` | *可选* | Telegram Bot 凭据（联系 @BotFather 获取） |
| `TELEGRAM_CHAT_ID` | *可选* | 告警目标频道或群组 Chat ID（如 `-1001234567890`） |
| `ADMIN_SECRET` | `admin123` | 后台管理验证密钥 |

---

## 🔌 核心 API 接口清单

- `GET /api/status` : 获取系统全局运行态势、所有节点、端点与事件
- `GET /api/nodes` : 列出所有受控服务器节点
- `POST /api/nodes` : 注册新节点
- `PUT /api/nodes/:id` : 更新指定节点信息
- `DELETE /api/nodes/:id` : 移除指定节点
- `POST /api/nodes/:id/report` : Linux Agent 探针指标上报接口（接收 CPU、内存、流量、温度等）
- `GET /api/services` : 获取所有 HTTP/TCP 探测端点
- `POST /api/services` : 添加新探测端点
- `POST /api/services/:id/check` : 触发单次即时连通性与延迟探测
- `GET /api/incidents` : 获取事件历史与维护公告列表
- `POST /api/incidents` : 发布新事件或维护公告
- `POST /api/telegram/config` : 保存 Telegram Bot 配置与告警阈值
- `POST /api/telegram/test-bot` : 验证 Telegram Bot 连通性
- `POST /api/telegram/test-alert` : 发送模拟告警消息至 Telegram 群组
- `POST /api/telegram/sync` : 从 Telegram Bot 同步最新节点心跳
- `GET /api/agent/script` : 生成并下载当前服务器适配的一键 Agent 安装 Bash 脚本
- `GET /api/download/project.zip` : **一键动态打包下载当前全部源码、配置与部署文件 (ZIP 压缩包)**
- `GET /api/download/project-info.md` : 下载本说明书文件
- `GET /api/export` : 导出全量节点与服务数据快照 (JSON)

---

## 🚀 三种主流部署方案速查

### 方案 1: Cloudflare Pages (边缘分发，全球零成本)
1. Fork 或上传代码至 GitHub 仓库；
2. 登录 Cloudflare Dashboard -> Workers & Pages -> Create application -> Connect to Git；
3. 构建命令填 `npm run build`，输出目录填 `dist`；
4. 部署完成后即可通过 Cloudflare 的全球 300+ 边缘节点极速访问。

### 方案 2: Docker & Docker Compose (容器化一键拉起)
```bash
# 1. 克隆代码并进入目录
git clone https://github.com/TRpAI/monitor-bot.git && cd monitor-bot

# 2. 一键启动容器
docker compose up -d --build

# 3. 检查容器运行状态
docker compose ps
curl http://localhost:3000/api/status
```

### 方案 3: Linux VPS / 裸机部署 (PM2 + Nginx)
```bash
# 1. 运行一键构建与部署脚本
chmod +x deploy.sh
./deploy.sh

# 2. 或者手动使用 PM2 常驻
npm install
npm run build
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

---

## 🤖 Telegram Bot 交互指令

配置并在群组添加您的 Bot 后，可直接在群内输入：
- `/status` : 获取集群健康摘要与服务运转总览
- `/nodes` : 打印在线服务器节点与 IP 清单
- `/services` : 检测并汇报所有 HTTP/TCP 探针端点可用状态
- `/help` : 查看所有运维指令

---

## ⚠️ Cloudflare Pages 部署常见排查 (为什么可能与本地 Preview 不一致？)

### 原因 1：Git 仓库代码尚未更新至最新版
* **原因**：Cloudflare Pages 绑定的是您的 GitHub 仓库。如果您只在 AI Studio 中调试，而未将最新代码提交并推送（Push）到对应的 GitHub 仓库分支，Cloudflare Pages 展示的将是之前构建的**旧版本静态文件**。
* **解决办法**：
  1. 点击页面顶部或管理后台的 **「打包下载」** 按钮，或者使用 AI Studio 右上角的 **「Export to GitHub」/「Export to ZIP」**；
  2. 将解压出的最新文件提交（Commit）并推送到您的 GitHub 仓库；
  3. Cloudflare Pages 检测到代码提交后会自动触发重新构建（Deploy），构建完成后刷新页面即与当前 Preview 完全一致。

### 原因 2：静态前端 (Cloudflare Pages) 与后端 API 服务 (Express) 的架构差异
* **原因**：Preview 预览环境中同时运行了前端 React 与常驻的 Node.js/Express 服务端 (`server.ts`)。而 Cloudflare Pages 默认是**纯静态页面分发网络**（Static Hosting），无法直接运行 `server.ts` 里的长连接与本地后台进程。
* **解决办法**（二选一）：
  * **方案 A（纯边缘模式 / 推荐无需自备服务器）**：本项目已内置 `functions/api/[[route]].ts`。当代码推送到 Cloudflare Pages 时，Cloudflare 会自动编译部署 Pages Functions 边缘函数，原生在 Cloudflare 边缘接管 `/api/status` 等请求，无需自建服务器！
  * **方案 B（经典动静分离 / 连接自有 VPS 后端）**：将 Express 后端或 Docker 容器运行在您的 VPS 上（例如 `http://your-vps-ip:3000` 或域名 `https://api.yourdomain.com`）。在 Cloudflare Pages 项目后台的 **Settings -> Environment variables** 中添加 `VITE_API_BASE_URL = https://api.yourdomain.com`，前端即可自动跨域请求您的真实 VPS 后端！

### 原因 3：单页应用路由重写 (SPA 404)
* **解决办法**：本项目已在 `public/_redirects` 中添加了 `/*  /index.html  200` 规则，确保在 Cloudflare Pages 任意页面刷新时均不会报 404 错误。
