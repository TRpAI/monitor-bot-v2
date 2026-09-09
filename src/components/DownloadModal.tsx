import React, { useState } from 'react';
import {
  X,
  Download,
  FolderArchive,
  FileCode,
  FileText,
  Database,
  CheckCircle2,
  ExternalLink,
  Layers,
  Terminal,
  ShieldCheck,
  Server
} from 'lucide-react';
import { getApiBase } from '../api';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalNodes: number;
  totalServices: number;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  totalNodes,
  totalServices,
}) => {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  if (!isOpen) return null;

  const apiBase = getApiBase();

  const handleDownloadZip = () => {
    setDownloadingZip(true);
    setZipSuccess(false);

    // Trigger browser download directly via the dedicated packaging endpoint
    const link = document.createElement('a');
    link.href = `${apiBase}/api/download/project.zip`;
    link.setAttribute('download', 'monitor-bot-full-project.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingZip(false);
      setZipSuccess(true);
    }, 1500);
  };

  const handleDownloadMarkdown = () => {
    const link = document.createElement('a');
    link.href = `${apiBase}/api/download/project-info.md`;
    link.setAttribute('download', 'PROJECT_INFO.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const link = document.createElement('a');
    link.href = `${apiBase}/api/download/data.json`;
    link.setAttribute('download', 'monitor-bot-data.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>项目源码与全量信息打包下载</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                支持打包下载完整前端、后端、多端部署配置、说明文档与当前监控数据
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main ZIP Download Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-50 via-white to-slate-50 dark:from-cyan-950/40 dark:via-slate-800/80 dark:to-slate-900 border border-cyan-200 dark:border-cyan-500/30 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    完整项目源码包 (ZIP 格式)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono">
                    .zip 压缩包
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                  包含前端 SPA + Express 完整后端、Dockerfile、docker-compose、Cloudflare 部署文件、Nginx 与 PM2 配置、Linux Agent 脚本、项目说明书及当前节点配置快照。
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <FileCode className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> React 19 + TypeScript
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <Server className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Express API
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Docker + Cloudflare
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip}
                className={`shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-md cursor-pointer ${
                  downloadingZip
                    ? 'bg-cyan-600/50 text-cyan-200 cursor-not-allowed'
                    : zipSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/20'
                }`}
              >
                {downloadingZip ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cyan-200 border-t-transparent rounded-full animate-spin" />
                    <span>正在打包...</span>
                  </>
                ) : zipSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>下载已开始</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>打包下载完整 ZIP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Individual Components / Artifacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Documentation Markdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">项目完整信息清单</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  包含架构总览、API 规范、Telegram Bot 指令与三大平台部署手册 (PROJECT_INFO.md)
                </p>
              </div>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>下载项目文档 (.md)</span>
              </button>
            </div>

            {/* Current Snapshot JSON */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">当前监控数据快照</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  包含当前实测 {totalNodes} 个服务器节点遥测、{totalServices} 个 HTTP 端点及事件历史 (JSON)
                </p>
              </div>
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>导出数据快照 (.json)</span>
              </button>
            </div>
          </div>

          {/* Included Files Inventory */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>压缩包内核心文件结构</span>
            </h4>
            <div className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60 leading-relaxed overflow-x-auto space-y-1">
              <div>📁 <span className="text-slate-800 dark:text-slate-200 font-semibold">monitor-bot-full-project/</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">PROJECT_INFO.md</span> <span className="text-slate-500 dark:text-slate-400"># 完整项目信息、架构与部署指南</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">server.ts</span> <span className="text-slate-500 dark:text-slate-400"># Express 全栈后端 (API + TG Bot 同步 + 动态压缩)</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">Dockerfile</span> <span className="text-slate-500 dark:text-slate-400"># 生产级安全容器构建定义</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">docker-compose.yml</span> <span className="text-slate-500 dark:text-slate-400"># Docker 一键运行编排</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">wrangler.toml</span> <span className="text-slate-500 dark:text-slate-400"># Cloudflare Pages 部署配置</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">deploy.sh</span> <span className="text-slate-500 dark:text-slate-400"># VPS 一键安装部署自动化脚本</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">ecosystem.config.cjs</span> <span className="text-slate-500 dark:text-slate-400"># PM2 守护配置</span></div>
              <div className="pl-4">├── 📄 <span className="text-cyan-600 dark:text-cyan-300">nginx.conf.example</span> <span className="text-slate-500 dark:text-slate-400"># Nginx 生产反向代理配置</span></div>
              <div className="pl-4">├── 📁 <span className="text-amber-600 dark:text-amber-300">src/</span> <span className="text-slate-500 dark:text-slate-400"># 前端全部 React 19 + TypeScript + Tailwind 组件</span></div>
              <div className="pl-4">└── 📁 <span className="text-emerald-600 dark:text-emerald-300">data/current_snapshot.json</span> <span className="text-slate-500 dark:text-slate-400"># 实时导出的节点与配置数据</span></div>
            </div>
          </div>

          {/* AI Studio Platform Export Tip */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Google AI Studio 原生导出支持</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                除了点击上方按钮直接下载本系统动态打包的 ZIP 压缩包外，您还可以通过 Google AI Studio 界面右上角的菜单选择
                <strong className="text-cyan-700 dark:text-cyan-300 mx-1">"Export to GitHub"</strong> 或
                <strong className="text-cyan-700 dark:text-cyan-300 mx-1">"Export to ZIP"</strong>，随时将最新代码同步至您的个人代码库。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>基于</span>
            <a
              href="https://github.com/TRpAI/monitor-bot"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              TRpAI/monitor-bot
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
