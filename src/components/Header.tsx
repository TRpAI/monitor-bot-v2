import React from 'react';
import { Activity, RefreshCw, Shield, Bot, Radio, Clock, CheckCircle2, AlertTriangle, XCircle, Download } from 'lucide-react';
import { SystemOverview } from '../types';

interface HeaderProps {
  overview: SystemOverview;
  activeTab: 'all' | 'nodes' | 'services' | 'incidents';
  setActiveTab: (tab: 'all' | 'nodes' | 'services' | 'incidents') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
  onLogoutAdmin: () => void;
  onOpenDownload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  overview,
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  refreshInterval,
  setRefreshInterval,
  isAdminLoggedIn,
  onOpenAdmin,
  onLogoutAdmin,
  onOpenDownload,
}) => {
  const getStatusBadge = () => {
    switch (overview.overallStatus) {
      case 'operational':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>系统运行正常</span>
          </div>
        );
      case 'degraded':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            <span>部分节点/服务降级</span>
          </div>
        );
      case 'outage':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-medium">
            <XCircle className="w-3.5 h-3.5 animate-bounce" />
            <span>服务异常中断</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950/50">
              <Activity className="w-5 h-5" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">MonitorBot</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  v2.4
                </span>
                <a
                  href="https://github.com/TRpAI/monitor-bot"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800"
                >
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span>TRpAI/monitor-bot</span>
                </a>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">实时服务器探针与多端可用性监控看板</p>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-900/70 border border-slate-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              全景看板
            </button>
            <button
              onClick={() => setActiveTab('nodes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'nodes'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              服务器探针 ({overview.totalNodes})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'services'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              服务监测 ({overview.totalServices})
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'incidents'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              事件公告
            </button>
          </nav>

          {/* Right Status Pill & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block">
              {getStatusBadge()}
            </div>

            {/* Refresh selector & button */}
            <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5 text-xs">
              <select
                aria-label="自动刷新频率"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-slate-300 text-xs px-2 py-1 outline-hidden cursor-pointer"
              >
                <option value={10} className="bg-slate-900 text-slate-200">10s 刷新</option>
                <option value={30} className="bg-slate-900 text-slate-200">30s 刷新</option>
                <option value={60} className="bg-slate-900 text-slate-200">60s 刷新</option>
                <option value={0} className="bg-slate-900 text-slate-200">暂停刷新</option>
              </select>

              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="立即刷新数据"
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* One-click Download Project Button */}
            <button
              onClick={onOpenDownload}
              title="打包下载全部文件与项目信息 (ZIP)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-950/70 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/70 hover:border-cyan-700 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">打包下载</span>
            </button>

            {/* Admin Console Button */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>管理控制台</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  title="退出管理"
                  className="p-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded"
                >
                  退出
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>后台管理</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-900 gap-1.5 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap ${
              activeTab === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            全景看板
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-3 py-1 rounded-full whitespace-nowrap ${
              activeTab === 'nodes' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            服务器 ({overview.totalNodes})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1 rounded-full whitespace-nowrap ${
              activeTab === 'services' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            服务监测 ({overview.totalServices})
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1 rounded-full whitespace-nowrap ${
              activeTab === 'incidents' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            事件公告
          </button>
        </div>
      </div>
    </header>
  );
};
