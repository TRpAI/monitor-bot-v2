#!/bin/bash
set -e

echo "🚀 MonitorBot V2 一键部署脚本"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 20+"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm"
    exit 1
fi

echo "✅ Node.js $(node --version) 已安装"
echo "✅ npm $(npm --version) 已安装"

# 创建部署目录
DEPLOY_DIR="/opt/monitor-bot-v2"
if [ ! -d "$DEPLOY_DIR" ]; then
    mkdir -p "$DEPLOY_DIR"
    echo "📁 创建部署目录: $DEPLOY_DIR"
fi

# 复制文件
echo "📦 复制文件..."
cp -r /tmp/monitor-bot-v2/* "$DEPLOY_DIR/"
cp -r /tmp/monitor-bot-v2/.* "$DEPLOY_DIR/" 2>/dev/null || true

# 安装依赖
echo "📦 安装依赖..."
cd "$DEPLOY_DIR"
npm ci --production

# 构建前端
echo "🔨 构建前端..."
npm run build

# 创建数据目录
mkdir -p "$DEPLOY_DIR/data"

# 创建 systemd 服务
echo "🔧 创建 systemd 服务..."
cat > /etc/systemd/system/monitor-bot-v2.service << 'EOF'
[Unit]
Description=MonitorBot V2 Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitor-bot-v2
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable monitor-bot-v2
systemctl start monitor-bot-v2

echo ""
echo "✅ 部署完成!"
echo ""
echo "📊 访问地址: http://YOUR_SERVER_IP:3000"
echo "📋 管理后台: http://YOUR_SERVER_IP:3000/?admin=true"
echo ""
echo "常用命令:"
echo "  systemctl status monitor-bot-v2  # 查看状态"
echo "  journalctl -u monitor-bot-v2 -f  # 查看日志"
echo "  systemctl restart monitor-bot-v2 # 重启服务"
echo ""
