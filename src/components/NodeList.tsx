import React, { useState, useMemo, useDeferredValue, memo, useCallback } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  ArrowUp,
  ArrowDown,
  Thermometer,
  Wifi,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  Bot,
  Activity,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import { MonitorNode } from '../types';
import { api } from '../api';

interface NodeListProps {
  nodes: MonitorNode[];
  onSelectNode: (node: MonitorNode) => void;
  onNodeUpdated?: (node: MonitorNode) => void;
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

type SortField = 'default' | 'ping-asc' | 'cpu-desc' | 'ram-desc' | 'uptime-desc' | 'name-asc';
type StatusFilter = 'all' | 'online' | 'issues';

const getLatencyColor = (ms: number) => {
  if (ms <= 50) return 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (ms <= 120) return 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  if (ms <= 220) return 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
};

const getLoadBarColor = (percent: number) => {
  if (percent < 50) return 'bg-cyan-500';
  if (percent < 80) return 'bg-amber-500';
  return 'bg-rose-500';
};

// Memoized Individual Grid Card for high rendering performance
interface NodeCardProps {
  node: MonitorNode;
  onSelect: (node: MonitorNode) => void;
  onPing: (nodeId: string, e: React.MouseEvent) => void;
  isPinging: boolean;
}

const NodeGridCard: React.FC<NodeCardProps> = memo(({ node, onSelect, onPing, isPinging }) => {
  const flag = countryFlagMap[node.countryCode] || '🌐';
  const isOnline = node.status === 'online';

  return (
    <div
      onClick={() => onSelect(node)}
      className="group relative p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/90 transition-all duration-200 cursor-pointer shadow-xs dark:shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" title={node.region}>{flag}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {node.name}
                </h3>
                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {node.region} · {node.host}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => onPing(node.id, e)}
              disabled={isPinging}
              title="即时网络诊断与 Ping 测试"
              className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${getLatencyColor(node.metrics.ping.latencyMs)} hover:opacity-80`}
            >
              <Zap className={`w-3 h-3 ${isPinging ? 'animate-spin text-cyan-500' : ''}`} />
              <span>{isPinging ? '测速中' : `${node.metrics.ping.latencyMs}ms`}</span>
            </button>
          </div>
        </div>

        {/* Tags & OS */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
            {node.metrics.os}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
            {node.type?.toUpperCase() || 'VPS'}
          </span>
          {node.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Resource Gauges */}
        <div className="space-y-2.5">
          {/* CPU */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-mono">
                <Cpu className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>CPU ({node.metrics.cpu.cores} 核)</span>
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-medium">
                {node.metrics.cpu.usagePercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getLoadBarColor(node.metrics.cpu.usagePercent)}`}
                style={{ width: `${Math.min(100, node.metrics.cpu.usagePercent)}%` }}
              />
            </div>
          </div>

          {/* RAM */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-mono">
                <Server className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>内存 ({Math.round(node.metrics.memory.usedMb / 1024 * 10) / 10}G / {Math.round(node.metrics.memory.totalMb / 1024)}G)</span>
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-medium">
                {node.metrics.memory.percent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getLoadBarColor(node.metrics.memory.percent)}`}
                style={{ width: `${Math.min(100, node.metrics.memory.percent)}%` }}
              />
            </div>
          </div>

          {/* Disk */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-mono">
                <HardDrive className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>存储 ({node.metrics.disk.usedGb}G / {node.metrics.disk.totalGb}G)</span>
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-medium">
                {node.metrics.disk.percent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, node.metrics.disk.percent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bandwidth & Inspect action */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400">
            <ArrowUp className="w-3 h-3" />
            <span>{node.metrics.network.upSpeedKb > 1000 ? `${(node.metrics.network.upSpeedKb / 1024).toFixed(1)}MB/s` : `${node.metrics.network.upSpeedKb}KB/s`}</span>
          </span>
          <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
            <ArrowDown className="w-3 h-3" />
            <span>{node.metrics.network.downSpeedKb > 1000 ? `${(node.metrics.network.downSpeedKb / 1024).toFixed(1)}MB/s` : `${node.metrics.network.downSpeedKb}KB/s`}</span>
          </span>
          {node.metrics.temperatureCelsius !== undefined && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <Thermometer className="w-3 h-3" />
              <span>{node.metrics.temperatureCelsius}°C</span>
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-0.5 text-xs text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform font-medium">
          <span>详情</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
});

export const NodeList: React.FC<NodeListProps> = memo(({ nodes, onSelectNode, onNodeUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pingingNodeId, setPingingNodeId] = useState<string | null>(null);

  // Status counts
  const counts = useMemo(() => {
    let online = 0;
    let issues = 0;
    for (const n of nodes) {
      if (n.status === 'online') online++;
      else issues++;
    }
    return { all: nodes.length, online, issues };
  }, [nodes]);

  // Filtering & Sorting with deferred value for 60fps input response
  const processedNodes = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    let result = nodes.filter((node) => {
      const matchesSearch =
        !q ||
        node.name.toLowerCase().includes(q) ||
        node.host.toLowerCase().includes(q) ||
        node.region.toLowerCase().includes(q) ||
        node.tags.some((t) => t.toLowerCase().includes(q));

      const matchesType = selectedType === 'all' || node.type === selectedType;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'online'
          ? node.status === 'online'
          : node.status !== 'online';

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sorting
    switch (sortField) {
      case 'ping-asc':
        result.sort((a, b) => a.metrics.ping.latencyMs - b.metrics.ping.latencyMs);
        break;
      case 'cpu-desc':
        result.sort((a, b) => b.metrics.cpu.usagePercent - a.metrics.cpu.usagePercent);
        break;
      case 'ram-desc':
        result.sort((a, b) => b.metrics.memory.percent - a.metrics.memory.percent);
        break;
      case 'uptime-desc':
        result.sort((a, b) => (b.metrics.uptimeSeconds || 0) - (a.metrics.uptimeSeconds || 0));
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [nodes, deferredSearch, selectedType, statusFilter, sortField]);

  // Handle on-demand ping test
  const handlePingNode = useCallback(async (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pingingNodeId) return;

    setPingingNodeId(nodeId);
    try {
      const res = await api.pingNode(nodeId);
      const target = nodes.find((n) => n.id === nodeId);
      if (target && onNodeUpdated) {
        const updated: MonitorNode = {
          ...target,
          metrics: {
            ...target.metrics,
            ping: {
              ...target.metrics.ping,
              latencyMs: res.latencyMs,
            },
          },
        };
        onNodeUpdated(updated);
      }
    } finally {
      setPingingNodeId(null);
    }
  }, [nodes, pingingNodeId, onNodeUpdated]);

  return (
    <section className="space-y-4">
      {/* Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">服务器与探针节点矩阵</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {processedNodes.length} / {nodes.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            各节点心跳与指标由 TRpAI/monitor-bot 探针 Agent 每 15~30 秒实时同步上报
          </p>
        </div>

        {/* Quick status tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800/80 self-start lg:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            全部 ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('online')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'online'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            在线 ({counts.online})
          </button>
          <button
            onClick={() => setStatusFilter('issues')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'issues'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            异常/离线 ({counts.issues})
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50/70 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-[260px]">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs min-w-[160px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索节点名称、IP、机房或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500/50"
            />
          </div>

          {/* Type Filter */}
          <select
            aria-label="筛选节点类型"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="all">所有架构类型</option>
            <option value="vps">VPS 云服务器</option>
            <option value="dedicated">独立物理机</option>
            <option value="docker">Docker 容器节点</option>
            <option value="rpi">树莓派 / ARM 探针</option>
          </select>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              aria-label="排序方式"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="default">默认排列</option>
              <option value="ping-asc">按延迟升序 (最低优先)</option>
              <option value="cpu-desc">按 CPU 负载最高</option>
              <option value="ram-desc">按内存占用最高</option>
              <option value="uptime-desc">按在线时长最长</option>
              <option value="name-asc">按节点名称 A-Z</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="网格视图"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-cyan-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-medium'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-label="列表视图"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-cyan-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-medium'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {processedNodes.length === 0 && (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
          <Server className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">未找到匹配的探针节点</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            请尝试调整搜索关键词或重置筛选条件
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('all');
              setStatusFilter('all');
            }}
            className="mt-3 px-3 py-1.5 text-xs font-medium bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors cursor-pointer"
          >
            重置所有筛选
          </button>
        </div>
      )}

      {/* Grid Mode */}
      {viewMode === 'grid' && processedNodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedNodes.map((node) => (
            <NodeGridCard
              key={node.id}
              node={node}
              onSelect={onSelectNode}
              onPing={handlePingNode}
              isPinging={pingingNodeId === node.id}
            />
          ))}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && processedNodes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">节点名称</th>
                <th className="py-3 px-4">区域 / IP</th>
                <th className="py-3 px-4">系统</th>
                <th className="py-3 px-4">CPU使用</th>
                <th className="py-3 px-4">内存占用</th>
                <th className="py-3 px-4">磁盘</th>
                <th className="py-3 px-4">实时网络 (上/下)</th>
                <th className="py-3 px-4">诊断与延迟</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {processedNodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{countryFlagMap[node.countryCode] || '🌐'}</span>
                    <span className="truncate max-w-[140px]">{node.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${node.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                    {node.region} <span className="text-slate-400 dark:text-slate-500">({node.host})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {node.metrics.os}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={node.metrics.cpu.usagePercent > 80 ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-cyan-600 dark:text-cyan-400'}>
                      {node.metrics.cpu.usagePercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {node.metrics.memory.percent}% ({Math.round(node.metrics.memory.usedMb / 1024 * 10) / 10}G)
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {node.metrics.disk.percent}%
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                    ↑ {node.metrics.network.upSpeedKb}KB/s | ↓ {node.metrics.network.downSpeedKb}KB/s
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => handlePingNode(node.id, e)}
                      disabled={pingingNodeId === node.id}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${getLatencyColor(node.metrics.ping.latencyMs)}`}
                      title="点击即时测试 Ping"
                    >
                      <Zap className={`w-3 h-3 ${pingingNodeId === node.id ? 'animate-spin' : ''}`} />
                      <span>{pingingNodeId === node.id ? '测速中' : `${node.metrics.ping.latencyMs}ms`}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode(node);
                      }}
                      className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-medium cursor-pointer"
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
