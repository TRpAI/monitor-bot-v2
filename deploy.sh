#!/usr/bin/env bash
# ==============================================================================
# MonitorBot Web & Admin 一键部署脚本
# 适配 TRpAI/monitor-bot 项目
# 支持: Cloudflare 构建 / Docker / 原始物理机与 VPS 部署
# ==============================================================================

set -e

GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${CYAN}================================================================${RESET}"
echo -e "${CYAN}   MonitorBot Web 展示页与后台管理系统 - 快速部署助手           ${RESET}"
echo -e "${CYAN}================================================================${RESET}"

MODE="${1:-interactive}"

case "$MODE" in
  docker)
    echo -e "${GREEN}>>> 启动 Docker 容器部署...${RESET}"
    if ! command -v docker &> /dev/null; then
      echo -e "${RED}错误: 未检测到 Docker，请先安装 Docker。${RESET}"
      exit 1
    fi
    docker compose down || true
    docker compose up -d --build
    echo -e "${GREEN}>>> Docker 部署成功！访问地址: http://localhost:3000${RESET}"
    ;;

  baremetal|native|pm2)
    echo -e "${GREEN}>>> 启动原生 (Bare-metal / VPS) 部署...${RESET}"
    if ! command -v node &> /dev/null; then
      echo -e "${RED}错误: 未检测到 Node.js，请先安装 Node.js >= 18。${RESET}"
      exit 1
    fi
    echo -e "${YELLOW}1. 安装依赖...${RESET}"
    npm install
    echo -e "${YELLOW}2. 构建生产静态资源与服务端...${RESET}"
    npm run build
    
    if command -v pm2 &> /dev/null; then
      echo -e "${YELLOW}3. 检测到 PM2，使用 PM2 守护进程启动...${RESET}"
      pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
      pm2 save
      echo -e "${GREEN}>>> PM2 服务启动完毕！${RESET}"
    else
      echo -e "${YELLOW}3. 未安装 PM2，直接启动 node 服务 (推荐生产环境使用 pm2 或 systemd)...${RESET}"
      echo -e "${CYAN}>>> 请运行: npm start 或 nohup node dist/server.cjs > monitor.log 2>&1 &${RESET}"
      npm start
    fi
    ;;

  cloudflare)
    echo -e "${GREEN}>>> 构建 Cloudflare Pages 静态产物...${RESET}"
    npm install
    npm run build
    echo -e "${GREEN}>>> 静态产物已生成至 dist/ 目录。${RESET}"
    echo -e "${CYAN}>>> 您可直接使用 wrangler pages deploy dist 或在 Cloudflare Dashboard 中连接仓库自动构建。${RESET}"
    ;;

  *)
    echo "请选择部署模式:"
    echo "  1) Docker 部署 (推荐，一键容器化)"
    echo "  2) 原生 VPS 部署 (Node.js + PM2 / Systemd)"
    echo "  3) Cloudflare Pages 构建"
    read -p "请输入选项 [1-3]: " CHOICE
    case "$CHOICE" in
      1) bash "$0" docker ;;
      2) bash "$0" baremetal ;;
      3) bash "$0" cloudflare ;;
      *) echo "无效选项，退出。" ; exit 1 ;;
    esac
    ;;
esac
