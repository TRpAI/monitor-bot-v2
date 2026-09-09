import React, { useState } from 'react';
import { Cloud, Container, Server, Copy, Check, Terminal, ExternalLink, ShieldCheck, Download, Code } from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'cloudflare' | 'docker' | 'baremetal' | 'agent'>('cloudflare');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (key: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // ignore
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const wranglerTomlContent = `name = "monitor-bot-web"
compatibility_date = "2024-09-01"
pages_build_output_dir = "dist"

[vars]
ENVIRONMENT = "production"
# TELEGRAM_BOT_TOKEN = "your_bot_token"
# TELEGRAM_CHAT_ID = "your_chat_id"
# ADMIN_SECRET = "admin123"

[build]
command = "npm run build"
watch_dir = "src"`;

  const dockerfileContent = `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/status || exit 1
CMD ["node", "dist/server.cjs"]`;

  const dockerComposeContent = `services:
  monitor-web:
    build:
      context: .
      dockerfile: Dockerfile
    image: trpai/monitor-bot-web:latest
    container_name: monitor-bot-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN:-}
      - TELEGRAM_CHAT_ID=\${TELEGRAM_CHAT_ID:-}
      - ADMIN_SECRET=\${ADMIN_SECRET:-admin123}
    volumes:
      - ./data:/app/data`;

  const pm2Content = `module.exports = {
  apps: [
    {
      name: 'monitor-bot-web',
      script: './dist/server.cjs',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      }
    }
  ]
};`;

  const systemdService = `[Unit]
Description=MonitorBot Web & Admin Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/monitor-bot
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target`;

  const nginxConfig = `server {
    listen 80;
    server_name status.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}`;

  return (
    <div className="space-y-6">
      {/* Navigation Pills */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80 w-fit">
        <button
          onClick={() => setActiveSubTab('cloudflare')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeSubTab === 'cloudflare' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Cloudflare 部署</span>
        </button>
        <button
          onClick={() => setActiveSubTab('docker')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeSubTab === 'docker' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Container className="w-3.5 h-3.5" />
          <span>Docker 部署</span>
        </button>
        <button
          onClick={() => setActiveSubTab('baremetal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeSubTab === 'baremetal' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>原始 VPS 部署 (Bare-Metal)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('agent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeSubTab === 'agent' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>探针 Agent 指令</span>
        </button>
      </div>

      {/* 1. Cloudflare Tab */}
      {activeSubTab === 'cloudflare' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">部署至 Cloudflare Pages 全球边缘网络</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800">
                免费 · 全球高可用 · CDN分发
              </span>
            </div>
            <p className="text-xs text-slate-300">
              项目完全适配 Cloudflare Pages 静态与边缘集成。通过 Cloudflare 的全球 Anycast 网络，您可在全球 300+ 城市获得极致访问速度。
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-orange-400 font-mono">STEP 01</span>
              <h4 className="text-xs font-semibold text-slate-100">连接 GitHub 仓库</h4>
              <p className="text-[11px] text-slate-400">
                登录 Cloudflare 控制台，进入 <strong>Workers & Pages</strong>，选择 <strong>Create application</strong> 并连接本项目仓库。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-orange-400 font-mono">STEP 02</span>
              <h4 className="text-xs font-semibold text-slate-100">配置构建参数</h4>
              <div className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 space-y-1">
                <div>Framework: <span className="text-cyan-400">Vite</span></div>
                <div>Build Command: <span className="text-cyan-400">npm run build</span></div>
                <div>Output Dir: <span className="text-cyan-400">dist</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-orange-400 font-mono">STEP 03</span>
              <h4 className="text-xs font-semibold text-slate-100">一键命令行发布 (可选)</h4>
              <p className="text-[11px] text-slate-400">
                本地使用 Wrangler CLI 也可以直接推送构建产物发布上线。
              </p>
            </div>
          </div>

          {/* Config file box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-orange-400" />
                <span>wrangler.toml (已内置于项目根目录)</span>
              </span>
              <button
                onClick={() => copyText('wrangler', wranglerTomlContent)}
                className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 bg-orange-950/40 border border-orange-800/50 px-2.5 py-1 rounded transition-colors"
              >
                {copiedKey === 'wrangler' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'wrangler' ? '已复制' : '复制配置'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto border border-slate-800">
              <code>{wranglerTomlContent}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 2. Docker Tab */}
      {activeSubTab === 'docker' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Container className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">使用 Docker & Docker Compose 容器化部署</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                多阶段构建 · 轻量 Alpine · 健康检查
              </span>
            </div>
            <p className="text-xs text-slate-300">
              项目已自带标准多阶段构建 Dockerfile，体积精简，内建非 root 安全用户与健康检查。
            </p>
          </div>

          {/* One-liner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">一键启动命令</span>
              <button
                onClick={() => copyText('docker-run', 'docker compose up -d --build')}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-800/50 px-2.5 py-1 rounded transition-colors"
              >
                {copiedKey === 'docker-run' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'docker-run' ? '已复制' : '复制命令'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-cyan-300 text-xs font-mono border border-slate-800">
              <code>docker compose up -d --build</code>
            </pre>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Dockerfile Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">Dockerfile</span>
                <button
                  onClick={() => copyText('dockerfile', dockerfileContent)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  {copiedKey === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto border border-slate-800 max-h-56">
                <code>{dockerfileContent}</code>
              </pre>
            </div>

            {/* Docker Compose Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">docker-compose.yml</span>
                <button
                  onClick={() => copyText('compose', dockerComposeContent)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  {copiedKey === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto border border-slate-800 max-h-56">
                <code>{dockerComposeContent}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bare-metal Tab */}
      {activeSubTab === 'baremetal' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">原始服务器部署 (Linux / VPS / PM2 / Systemd)</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                零容器依赖 · 原生高性能
              </span>
            </div>
            <p className="text-xs text-slate-300">
              适用于各类标准 Linux 发行版（Debian、Ubuntu、CentOS、AlmaLinux、Arch）。
            </p>
          </div>

          {/* Quick Steps */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">标准安装与构建命令</h4>
            <div className="relative">
              <pre className="p-3 rounded-lg bg-slate-900 text-cyan-300 text-xs font-mono overflow-x-auto border border-slate-800">
                <code>{`# 1. 克隆或解压代码
git clone https://github.com/TRpAI/monitor-bot.git && cd monitor-bot

# 2. 安装依赖并编译前端与后端
npm install
npm run build

# 3. 使用 PM2 后台常驻 (推荐)
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup`}</code>
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Systemd Service Template */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">systemd 服务文件 (/etc/systemd/system/monitor.service)</span>
                <button
                  onClick={() => copyText('systemd', systemdService)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  {copiedKey === 'systemd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto border border-slate-800 max-h-56">
                <code>{systemdService}</code>
              </pre>
            </div>

            {/* Nginx Reverse Proxy Template */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">Nginx 反向代理模板 (含 WebSocket 支持)</span>
                <button
                  onClick={() => copyText('nginx', nginxConfig)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  {copiedKey === 'nginx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto border border-slate-800 max-h-56">
                <code>{nginxConfig}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 4. Agent Setup Tab */}
      {activeSubTab === 'agent' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">探针客户端 Agent 一键接入</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                无依赖 · 纯 Shell + cURL · 秒级生效
              </span>
            </div>
            <p className="text-xs text-slate-300">
              在被监控的 VPS、树莓派或独立服务器上运行以下命令，即可自动上报 CPU、内存、存储、网络流量及温度等关键指标至本展示页与后台。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">单次即时上报命令</span>
              <button
                onClick={() => copyText('agent-run', `curl -fsSL https://${window.location.host}/api/agent/script | bash`)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-1 rounded transition-colors"
              >
                {copiedKey === 'agent-run' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'agent-run' ? '已复制' : '复制命令'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-cyan-300 text-xs font-mono overflow-x-auto border border-slate-800">
              <code>curl -fsSL https://{window.location.host}/api/agent/script | bash</code>
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">配置定时心跳 (Crontab 每分钟上报)</h4>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-xs font-mono overflow-x-auto border border-slate-800">
              <code>{`# 运行 crontab -e 添加以下行:
* * * * * curl -fsSL https://${window.location.host}/api/agent/script | bash >/dev/null 2>&1`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
