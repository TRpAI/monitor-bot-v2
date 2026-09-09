import React, { memo } from 'react';
import { Server, Globe, Zap, Bot, ArrowUpRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { SystemOverview, Incident } from '../types';

interface StatusBannerProps {
  overview: SystemOverview;
  activeIncidents: Incident[];
  onTriggerTgSync: () => void;
  isSyncingTg: boolean;
  onViewIncidents: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = memo(({
  overview,
  activeIncidents,
  onTriggerTgSync,
  isSyncingTg,
  onViewIncidents,
}) => {
  const isHealthy = overview.overallStatus === 'operational';

  return (
    <div className="space-y-4">
      {/* Active Incident Warning Alert Bar (if any) */}
      {activeIncidents.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start justify-between gap-4 text-amber-200 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-100">正在处理的异常事件</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {activeIncidents[0].severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-amber-300/90 mt-1">{activeIncidents[0].title}</p>
              {activeIncidents[0].updates[0] && (
                <p className="text-xs text-amber-400/70 mt-1 font-mono">
                  最新进展: {activeIncidents[0].updates[0].message}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onViewIncidents}
            className="shrink-0 flex items-center gap-1 text-xs text-amber-300 hover:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors"
          >
            <span>查看时间线</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Status Hero & 4 Statistics Cards */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        {/* Subtle background ambient light */}
        <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none ${
          isHealthy ? 'bg-cyan-500' : 'bg-amber-500'
        }`} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isHealthy ? '所有系统与探针节点运行正常' : '系统存在部分节点延迟或服务降级'}
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              监控数据实时由 <strong className="text-cyan-600 dark:text-cyan-400 font-mono">TRpAI/monitor-bot</strong> 守护进程与边缘探针回传，提供秒级状态聚合、历史可用性与自动化 Telegram 报警。
            </p>
          </div>

          {/* TG Bot Sync Action Card */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/90 self-start lg:self-auto">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Telegram 同步</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {overview.telegramSync.botUsername || '@TRpAI_MonitorBot'}
              </p>
            </div>
            <button
              onClick={onTriggerTgSync}
              disabled={isSyncingTg}
              title="立即向 Telegram Bot 拉取并同步探针心跳"
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTg ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
              <span>{isSyncingTg ? '同步中' : '立即同步'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          
          {/* Card 1: Nodes */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">服务器节点</span>
              <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{overview.onlineNodes}</span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/ {overview.totalNodes} 在线</span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 dark:bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(overview.onlineNodes / (overview.totalNodes || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 2: Services */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">端点服务可用率</span>
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{overview.overallUptimePercent}%</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">Past 90d</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>{overview.operationalServices} / {overview.totalServices} 服务端点响应正常</span>
            </p>
          </div>

          {/* Card 3: Latency */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">全球加权平均延迟</span>
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{overview.avgLatencyMs}</span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">ms</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              涵盖亚太 CN2/BGP、北美及欧洲核心骨干
            </p>
          </div>

          {/* Card 4: Last Heartbeat */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">最近 TG 心跳上报</span>
              <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 truncate">
              {overview.telegramSync.lastSyncTime ? overview.telegramSync.lastSyncTime.split(' ')[1] : '实时监听中'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono truncate">
              通道状态: <span className="text-cyan-600 dark:text-cyan-400">双向长轮询就绪</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
});
