# MonitorBot V2 - 全栈监控系统

基于开源项目 [TRpAI/monitor-bot](https://github.com/TRpAI/monitor-bot) 进行全栈重构与增强。

## ✨ 特性

- 🌐 **全球服务器遥测展示大屏** - 实时可视化节点状态
- 🔍 **HTTP/TCP 探针监控** - 多节点分布式探测
- 📊 **故障排查事件时间线** - 完整的事件历史记录
- 🤖 **Telegram Bot 集成** - 数据同步与告警中心
- 🚀 **多平台一键部署** - Cloudflare / Docker / VPS

## 📁 项目结构

```
.
├── src/                    # React 19 + TypeScript 前端源码
│   ├── components/         # 组件目录
│   │   ├── admin/          # 管理后台组件
│   │   ├── Header.tsx
│   │   ├── StatusBanner.tsx
│   │   ├── NodeList.tsx
│   │   ├── NodeDetailModal.tsx
│   │   ├── ServiceList.tsx
│   │   └── IncidentSection.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── api.ts
│   └── types.ts
├── server.ts               # Express 后端服务
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入真实配置

# 启动开发服务器
npm run dev
```

### Docker 部署

```bash
# 一键启动
docker compose up -d --build

# 查看状态
docker compose ps

# 访问
curl http://localhost:3000/api/status
```

### Cloudflare Pages

1. Fork 或上传代码至 GitHub 仓库
2. 登录 Cloudflare Dashboard → Workers & Pages
3. 创建应用 → Connect to Git
4. 构建命令: `npm run build`
5. 输出目录: `dist`

### VPS 部署

```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔌 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/status` | 获取系统全局状态 |
| GET | `/api/nodes` | 列出所有节点 |
| POST | `/api/nodes` | 注册新节点 |
| DELETE | `/api/nodes/:id` | 删除节点 |
| POST | `/api/nodes/:id/report` | Agent 指标上报 |
| GET | `/api/services` | 获取服务列表 |
| POST | `/api/services` | 添加服务 |
| POST | `/api/services/:id/check` | 触发探测 |
| GET | `/api/incidents` | 获取事件列表 |
| POST | `/api/incidents` | 发布事件 |
| POST | `/api/telegram/test-bot` | 测试 Bot 连接 |
| POST | `/api/telegram/sync` | 同步节点数据 |
| GET | `/api/agent/script` | 下载 Agent 安装脚本 |
| GET | `/api/export` | 导出数据快照 |

## ⚙️ 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | ✅ |
| `TELEGRAM_CHAT_ID` | 告警目标 Chat ID | ✅ |
| `ADMIN_SECRET` | 后台管理密钥 | ❌ |
| `PORT` | 服务端口 | ❌ |

## 📱 Telegram Bot 指令

- `/status` - 获取集群健康摘要
- `/nodes` - 打印在线节点清单

## 🔒 安全说明

- 默认后台密钥: `admin123`（请修改）
- 建议通过 Nginx/Caddy 反代启用 HTTPS
- Agent 上报使用 HTTPS 保证数据传输安全

## 📄 许可证

MIT
