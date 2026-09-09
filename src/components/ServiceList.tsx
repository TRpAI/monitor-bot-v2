import React, { useState, useMemo, useDeferredValue, memo } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Zap,
  Search,
  Filter,
} from 'lucide-react';
import { WebService } from '../types';

interface ServiceListProps {
  services: WebService[];
  onCheckService: (serviceId: string) => Promise<void>;
  onCheckAllServices?: () => Promise<void>;
  isCheckingAll?: boolean;
}

const getStatusIcon = (status: WebService['status']) => {
  switch (status) {
    case 'operational':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'degraded':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'outage':
      return <XCircle className="w-4 h-4 text-rose-500" />;
    default:
      return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
  }
};

const getStatusText = (status: WebService['status']) => {
  switch (status) {
    case 'operational':
      return '正常运行';
    case 'degraded':
      return '性能降级';
    case 'outage':
      return '服务中断';
    case 'maintenance':
      return '维护中';
  }
};

interface ServiceCardProps {
  svc: WebService;
  onCheck: (id: string) => Promise<void>;
  isChecking: boolean;
}

const ServiceItemCard: React.FC<ServiceCardProps> = memo(({ svc, onCheck, isChecking }) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; uptime: number } | null>(null);

  const history = svc.history90d && svc.history90d.length > 0
    ? svc.history90d
    : Array.from({ length: 90 }, (_, i) => ({
        date: `Day-${i + 1}`,
        status: 'operational' as const,
        uptimePercent: 100,
      }));

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
      {/* Top Row: Service Name, Status, Latency & Check Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{svc.name}</h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
              {svc.method}
            </span>
            {svc.url && (
              <a
                href={svc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 truncate max-w-[200px]"
              >
                <span>{svc.url.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
            {svc.sslValid && (
              <span
                title={`SSL证书有效期剩余 ${svc.sslExpiryDays} 天`}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 rounded"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>SSL {svc.sslExpiryDays}d</span>
              </span>
            )}
          </div>
          {svc.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{svc.description}</p>
          )}
        </div>

        {/* Right Meta Badges */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>{svc.latencyMs} ms</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium">
            {getStatusIcon(svc.status)}
            <span className="text-slate-700 dark:text-slate-200">{getStatusText(svc.status)}</span>
          </div>

          <button
            onClick={() => onCheck(svc.id)}
            disabled={isChecking}
            title="发起即时健康状态检测"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 90-Day Interactive Timeline Bar */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
          <span>90 天前</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            过去 90 天可用率: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{svc.uptime90d}%</strong>
          </span>
          <span>今天</span>
        </div>

        {/* Bar strips */}
        <div className="flex items-center gap-0.5 sm:gap-1 h-7 px-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80">
          {history.map((day, idx) => {
            const isDegraded = day.status === 'degraded';
            const isOutage = day.status === 'outage';
            const barColor = isOutage
              ? 'bg-rose-500'
              : isDegraded
              ? 'bg-amber-400'
              : 'bg-emerald-500 hover:bg-emerald-400';

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredDay({ date: day.date, uptime: day.uptimePercent })}
                onMouseLeave={() => setHoveredDay(null)}
                className={`flex-1 h-full rounded-xs transition-all duration-150 cursor-pointer ${barColor}`}
              />
            );
          })}
        </div>

        {/* Tooltip on Hover */}
        <div className="h-5 mt-1 flex items-center justify-center text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {hoveredDay ? (
            <span className="text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shadow-xs">
              {hoveredDay.date} · 可用率 {hoveredDay.uptime}%
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">悬停在色块上可查看单日可用性详情</span>
          )}
        </div>
      </div>
    </div>
  );
});

export const ServiceList: React.FC<ServiceListProps> = memo(({
  services,
  onCheckService,
  onCheckAllServices,
  isCheckingAll = false,
}) => {
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const handleCheck = async (id: string) => {
    setCheckingId(id);
    try {
      await onCheckService(id);
    } finally {
      setCheckingId(null);
    }
  };

  // Extract distinct groups
  const allGroups = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => set.add(s.group || '其他服务'));
    return Array.from(set);
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return services.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q));

      const matchGroup = selectedGroup === 'all' || (s.group || '其他服务') === selectedGroup;

      return matchSearch && matchGroup;
    });
  }, [services, deferredSearch, selectedGroup]);

  // Memoize grouped services
  const grouped = useMemo<Record<string, WebService[]>>(() => {
    const map: Record<string, WebService[]> = {};
    for (const svc of filteredServices) {
      const grp = svc.group || '其他服务';
      if (!map[grp]) map[grp] = [];
      map[grp].push(svc);
    }
    return map;
  }, [filteredServices]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">网络端点与服务可用性监测</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredServices.length} / {services.length} 个端点
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            每项服务均由探针集群发起多地区 HTTP/TCP 状态探测，统计过去 90 天可用率曲线
          </p>
        </div>

        {/* Batch Probe Action Button */}
        {onCheckAllServices && (
          <button
            onClick={onCheckAllServices}
            disabled={isCheckingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            title="并发发起全量端点健康检查与延迟测速"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAll ? 'animate-spin' : ''}`} />
            <span>{isCheckingAll ? '正在全量探测中...' : '全量端点探测'}</span>
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50/70 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800/60">
        <div className="relative flex-1 sm:max-w-xs min-w-[160px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索端点名称、URL或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500/50"
          />
        </div>

        {/* Group Filter */}
        <select
          aria-label="筛选业务分组"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-cyan-500/50 cursor-pointer"
        >
          <option value="all">所有业务分组</option>
          {allGroups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
          <Globe className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">未找到匹配的监测端点</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            请尝试调整搜索条件或选择不同的分组
          </p>
        </div>
      )}

      {/* Grouped Service Cards */}
      <div className="space-y-6">
        {(Object.entries(grouped) as [string, WebService[]][]).map(([groupName, svcs]) => (
          <div key={groupName} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
              <span>{groupName}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({svcs.length})</span>
            </h3>

            <div className="space-y-3">
              {svcs.map((svc) => (
                <ServiceItemCard
                  key={svc.id}
                  svc={svc}
                  onCheck={handleCheck}
                  isChecking={checkingId === svc.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
