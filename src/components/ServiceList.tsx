import React, { useState, useMemo, memo } from 'react';
import { Globe, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, RefreshCw, ExternalLink, Zap } from 'lucide-react';
import { WebService } from '../types';

interface ServiceListProps {
  services: WebService[];
  onCheckService: (serviceId: string) => Promise<void>;
}

export const ServiceList: React.FC<ServiceListProps> = memo(({ services, onCheckService }) => {
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; uptime: number; serviceId: string } | null>(null);

  const handleCheck = async (id: string) => {
    setCheckingId(id);
    await onCheckService(id);
    setCheckingId(null);
  };

  // Memoize grouped services
  const grouped = useMemo<Record<string, WebService[]>>(() => {
    const map: Record<string, WebService[]> = {};
    for (const svc of services) {
      const grp = svc.group || '其他服务';
      if (!map[grp]) map[grp] = [];
      map[grp].push(svc);
    }
    return map;
  }, [services]);

  const getStatusIcon = (status: WebService['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'outage':
        return <XCircle className="w-4 h-4 text-rose-400" />;
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

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">网络端点与服务可用性监测</h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {services.length} 个监测端点
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          每项服务均由探针集群发起多地区 HTTP/TCP 状态探测，统计过去 90 天可用率曲线
        </p>
      </div>

      {/* Grouped Service Cards */}
      <div className="space-y-6">
        {(Object.entries(grouped) as [string, WebService[]][]).map(([groupName, svcs]) => (
          <div key={groupName} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{groupName}</span>
              <span className="text-[10px] text-slate-500 font-mono">({svcs.length})</span>
            </h3>

            <div className="space-y-3">
              {svcs.map((svc) => {
                const history = svc.history90d && svc.history90d.length > 0
                  ? svc.history90d
                  : Array.from({ length: 90 }, (_, i) => ({
                      date: `Day-${i}`,
                      status: 'operational' as const,
                      uptimePercent: 100,
                    }));

                return (
                  <div
                    key={svc.id}
                    className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-colors shadow-xs"
                  >
                    {/* Top Row: Service Name, Status, Latency & Check Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-semibold text-sm text-slate-100">{svc.name}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                            {svc.method}
                          </span>
                          {svc.sslValid && (
                            <span
                              title={`SSL证书有效期剩余 ${svc.sslExpiryDays} 天`}
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>SSL {svc.sslExpiryDays}d</span>
                            </span>
                          )}
                        </div>
                        {svc.description && (
                          <p className="text-xs text-slate-400 mt-1">{svc.description}</p>
                        )}
                      </div>

                      {/* Right Meta Badges */}
                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="flex items-center gap-1 text-xs font-mono text-slate-300">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>{svc.latencyMs} ms</span>
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-medium">
                          {getStatusIcon(svc.status)}
                          <span className="text-slate-200">{getStatusText(svc.status)}</span>
                        </div>

                        <button
                          onClick={() => handleCheck(svc.id)}
                          disabled={checkingId === svc.id}
                          title="发起即时健康状态检测"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${checkingId === svc.id ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* 90-Day Interactive Timeline Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                        <span>90 天前</span>
                        <span className="text-slate-300 font-semibold">
                          过去 90 天可用率: <strong className="text-emerald-400 font-bold">{svc.uptime90d}%</strong>
                        </span>
                        <span>今天</span>
                      </div>

                      {/* Bar strips */}
                      <div className="flex items-center gap-0.5 sm:gap-1 h-8 px-1 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80">
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
                              onMouseEnter={() => setHoveredDay({ date: day.date, uptime: day.uptimePercent, serviceId: svc.id })}
                              onMouseLeave={() => setHoveredDay(null)}
                              className={`flex-1 h-full rounded-xs transition-all duration-150 cursor-pointer ${barColor}`}
                            />
                          );
                        })}
                      </div>

                      {/* Tooltip on Hover */}
                      <div className="h-5 mt-1 flex items-center justify-center text-[11px] font-mono text-slate-400">
                        {hoveredDay && hoveredDay.serviceId === svc.id ? (
                          <span className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {hoveredDay.date} · 可用率 {hoveredDay.uptime}%
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">悬停在色块上可查看单日可用性详情</span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
