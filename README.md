# MonitorBot Web & Admin 监控展示与后台管理系统

> 适配 [TRpAI/monitor-bot](https://github.com/TRpAI/monitor-bot) 项目的现代化实时服务器节点、服务状态展示看板与后台管理系统。
> 支持 **Cloudflare**、**Docker** 与 **原始服务器/VPS (Bare-Metal)** 三种环境一键部署。

---

## ✨ 核心特性

- 🌐 **高颜值实时展示看板 (Public Showcase)**:
  - 类似 UptimeRobot / BetterUptime / ServerStatus 的极简黑科技工业风。
  - 服务器节点矩阵：实时 CPU使用率、内存占用、磁盘空间、网络实时上下行带宽、温度 (°C)、负载及多地 Ping 延迟。
  - 服务可用性检测：90天历史可用性柱状条、SSL证书有效期倒计时、HTTP 状态码及响应延迟 (ms)。
  - 实时系统事件（Incident）公告栏与维护时间线跟踪。
- 🤖 **Telegram Bot 双向集成 (TG Bot Integration)**:
  - 直接对接 TRpAI/monitor-bot 机器人，支持从 Bot 读取探针数据与指令。
  - 支持主动向 Telegram 频道/群组下发节点宕机、超高负载、温度过高告警。
  - 支持 Webhook 接入与定时轮询双模式。
- 🖥️ **全功能后台管理控制台 (Admin Console)**:
  - 节点管理 (CRUD、一键生成 Linux 客户端上报命令)。
  - 服务与端点监控管理 (即时测试、修改探针参数)。
  - 事件与维护计划发布。
  - 部署中心 (在界面上一键查阅与复制各项部署配置)。
  - 数据全量导入/导出与备份。
- 🚀 **全平台部署兼容**:
  - **Cloudflare Pages / Workers**: 静态边缘分发 + 离线持久化。
  - **Docker & Docker Compose**: 一键容器化启动。
  - **原始部署 (Bare-metal / VPS)**: Node.js + PM2 / Systemd + Nginx。

---

## 🛠️ 快速开始与部署方式

### 方案一：Docker 部署 (推荐，最省心)

1. 克隆代码并进入目录：
   ```bash
   git clone https://github.com/TRpAI/monitor-bot.git
   cd monitor-bot
   ```
2. (可选) 配置环境变量：
   ```bash
   cp .env.example .env
   # 在 .env 中填入 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID
   ```
3. 使用 Docker Compose 一键构建启动：
   ```bash
   docker compose up -d --build
   ```
4. 访问 `http://你的服务器IP:3000` 即可进入系统。

---

### 方案二：Cloudflare 部署 (Cloudflare Pages)

1. 在 Cloudflare Dashboard 中选择 **Workers & Pages** -> **Create application** -> **Pages**。
2. 连接当前 GitHub 仓库。
3. 配置构建参数：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js Version**: `20` 或 `22` (在环境变量中设置 `NODE_VERSION=22`)
4. 点击 **Save and Deploy** 即可完成全球 CDN 部署。
5. 也可以直接通过命令行一键发布：
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=monitor-bot-web
   ```

---

### 方案三：原始服务器部署 (Bare Metal / VPS / Systemd / PM2)

适合 Ubuntu / Debian / CentOS / Alpine 等任何标准 Linux VPS：

1. 安装基础环境 (Node.js >= 18):
   ```bash
   # Debian / Ubuntu 示例
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. 安装依赖并编译：
   ```bash
   npm install
   npm run build
   ```
3. 使用 PM2 保持后台长效运行：
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
4. (可选) 配置 Nginx 反向代理：
   参考项目根目录下的 `nginx.conf.example` 配置域名及 SSL 证书。

---

## 🤖 与 TRpAI/monitor-bot 对接配置

1. 打开 Telegram，联系 [@BotFather](https://t.me/BotFather) 创建 Bot 并获取 `BOT_TOKEN`。
2. 将 Bot 拉入管理群组或频道，通过 [@userinfobot](https://t.me/userinfobot) 获取你的 `CHAT_ID`。
3. 进入本系统的后台管理 -> **TG Bot 集成中心**：
   - 输入 `Bot Token` 与 `Chat ID`。
   - 点击 **测试 Bot 连接** 进行连通性握手。
   - 点击 **发送测试告警** 验证消息推送。
4. 被监控节点安装上报 Agent：
   在后台 **节点管理** 或 **部署中心** 复制专属 Agent 命令，在被监控的 VPS 上执行即可自动上报 CPU、内存、温度及网络数据。

---

## 📄 环境变量说明

| 变量名 | 说明 | 默认值 |
| :--- | :--- | :--- |
| `PORT` | 网页监听端口 | `3000` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot 鉴权令牌 | 空 |
| `TELEGRAM_CHAT_ID` | Telegram 接收告警的聊天/群组ID | 空 |
| `ADMIN_SECRET` | 后台管理系统默认管理员密钥 | `admin123` |
