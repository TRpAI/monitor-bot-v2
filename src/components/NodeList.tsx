import React, { useState, useMemo, memo } from 'react';
import { Server, Cpu, HardDrive, ArrowUp, ArrowDown, Thermometer, Wifi, Search, Filter, LayoutGrid, List, ChevronRight, Bot } from 'lucide-react';
import { MonitorNode } from '../types';

interface NodeListProps {
  nodes: MonitorNode[];
  onSelectNode: (node: MonitorNode) => void;
}

const countryFlagMap: Record<string, string> = {
  HK: '🇭🇰',
  JP: '🇯🇵',
  US: '🇺🇸',
  SG: '🇸🇬',
  DE: '🇩🇪',
  CN: '🇨🇳',
  UN: '🌐',
};

export const NodeList: React.FC<NodeListProps> = memo(({ nodes, onSelectNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        (node.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.host || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((node.tags || []) as string[]).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === 'all' || node.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [nodes, searchTerm, selectedType]);

  const getLatencyColor = (ms: number) => {
    if (ms <= 50) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (ms <= 120) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    if (ms <= 220) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getLoadBarColor = (percent: number) => {
    if (percent < 50) return 'bg-cyan-500';
    if (percent < 80) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <section className="space-y-4">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">服务器与探针节点矩阵</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredNodes.length} / {nodes.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            各节点心跳与指标由 TRpAI/monitor-bot 探针 Agent 每 15~30 秒实时同步上报
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索节点、IP、机房或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500/50 w-44 sm:w-56"
            />
          </div>

          {/* Type Filter */}
          <select
            aria-label="筛选节点类型"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="all">所有类型</option>
            <option value="vps">VPS 云服务器</option>
            <option value="dedicated">独立物理机</option>
            <option value="docker">Docker 容器节点</option>
            <option value="rpi">树莓派 / ARM 探针</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="网格视图"
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-label="列表视图"
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node) => {
            const flag = countryFlagMap[node.countryCode] || '🌐';
            const isOnline = node.status === 'online';

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="group relative p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-cyan-950/40"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0" title={node.region}>{flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {node.name}
                        </h3>
                        {node.tgBotReported && (
                          <span title="通过 TRpAI/monitor-bot 机器人上报" className="text-cyan-400">
                            <Bot className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">
                        {node.region}
                      </p>
                    </div>
                  </div>

                  {/* Latency badge & Status dot */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${getLatencyColor(node.metrics.ping.latencyMs)}`}>
                      {node.metrics.ping.latencyMs} ms
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
                    {node.type.toUpperCase()}
                  </span>
                  {node.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-800/40"
                    >
                      {tag}
                    </span>
                  ))}
                  {node.metrics.temperatureCelsius && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 flex items-center gap-0.5">
                      <Thermometer className="w-3 h-3" />
                      <span>{node.metrics.temperatureCelsius}°C</span>
                    </span>
                  )}
                </div>

                {/* Metrics Progress Bars */}
                <div className="space-y-2.5 pt-1 border-t border-slate-800/60 text-xs">
                  {/* CPU */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>CPU ({node.metrics.cpu.cores}核)</span>
                      </span>
                      <span className="font-mono text-slate-200 font-medium">
                        {node.metrics.cpu.usagePercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getLoadBarColor(node.metrics.cpu.usagePercent)}`}
                        style={{ width: `${Math.min(100, node.metrics.cpu.usagePercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Server className="w-3 h-3 text-indigo-400" />
                        <span>内存 ({Math.round(node.metrics.memory.usedMb / 1024 * 10) / 10}G / {Math.round(node.metrics.memory.totalMb / 1024)}G)</span>
                      </span>
                      <span className="font-mono text-slate-200 font-medium">
                        {node.metrics.memory.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getLoadBarColor(node.metrics.memory.percent)}`}
                        style={{ width: `${Math.min(100, node.metrics.memory.percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Disk */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1 font-mono">
                        <HardDrive className="w-3 h-3 text-emerald-400" />
                        <span>存储 ({node.metrics.disk.usedGb}G / {node.metrics.disk.totalGb}G)</span>
                      </span>
                      <span className="font-mono text-slate-200 font-medium">
                        {node.metrics.disk.percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, node.metrics.disk.percent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Bandwidth & Inspect action */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3 font-mono">
                    <span className="flex items-center gap-0.5 text-cyan-400">
                      <ArrowUp className="w-3 h-3" />
                      <span>{node.metrics.network.upSpeedKb > 1000 ? `${(node.metrics.network.upSpeedKb / 1024).toFixed(1)}MB/s` : `${node.metrics.network.upSpeedKb}KB/s`}</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-indigo-400">
                      <ArrowDown className="w-3 h-3" />
                      <span>{node.metrics.network.downSpeedKb > 1000 ? `${(node.metrics.network.downSpeedKb / 1024).toFixed(1)}MB/s` : `${node.metrics.network.downSpeedKb}KB/s`}</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-xs text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    <span>详情</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">节点名称</th>
                <th className="py-3 px-4">区域 / IP</th>
                <th className="py-3 px-4">系统</th>
                <th className="py-3 px-4">CPU使用</th>
                <th className="py-3 px-4">内存占用</th>
                <th className="py-3 px-4">磁盘</th>
                <th className="py-3 px-4">实时网络 (上/下)</th>
                <th className="py-3 px-4">延迟</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredNodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                    <span>{countryFlagMap[node.countryCode] || '🌐'}</span>
                    <span>{node.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {node.region} <span className="text-slate-500">({node.host})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                    {node.metrics.os}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={node.metrics.cpu.usagePercent > 80 ? 'text-rose-400' : 'text-cyan-400'}>
                      {node.metrics.cpu.usagePercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {node.metrics.memory.percent}% ({Math.round(node.metrics.memory.usedMb / 1024 * 10) / 10}G)
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {node.metrics.disk.percent}%
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    ↑ {node.metrics.network.upSpeedKb}KB/s | ↓ {node.metrics.network.downSpeedKb}KB/s
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getLatencyColor(node.metrics.ping.latencyMs)}`}>
                      {node.metrics.ping.latencyMs}ms
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode(node);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-xs"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
});
