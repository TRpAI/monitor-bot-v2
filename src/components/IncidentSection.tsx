import React, { memo, useMemo } from 'react';
import { AlertOctagon, CheckCircle2, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Incident } from '../types';

interface IncidentSectionProps {
  incidents: Incident[];
}

export const IncidentSection: React.FC<IncidentSectionProps> = memo(({ incidents }) => {
  const activeIncidents = useMemo(() => incidents.filter((i) => i.status !== 'resolved'), [incidents]);
  const pastIncidents = useMemo(() => incidents.filter((i) => i.status === 'resolved'), [incidents]);

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'investigating':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            调查中 (Investigating)
          </span>
        );
      case 'identified':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            原因已确认 (Identified)
          </span>
        );
      case 'monitoring':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            观察恢复中 (Monitoring)
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            已恢复 (Resolved)
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: Incident['severity']) => {
    switch (sev) {
      case 'critical':
        return <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">严重中断</span>;
      case 'major':
        return <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">主要影响</span>;
      case 'minor':
        return <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">轻度异常</span>;
      case 'maintenance':
        return <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">计划维护</span>;
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">系统事件与维护公告历史</h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {incidents.length} 条记录
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          记录网络异常、上游光缆抖动、核心机房维护与故障处理完整进展时间线
        </p>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>当前活跃处理中事件 ({activeIncidents.length})</span>
          </h3>

          <div className="space-y-4">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-3 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(inc.severity)}
                    <h4 className="font-bold text-sm text-amber-100">{inc.title}</h4>
                  </div>
                  {getStatusBadge(inc.status)}
                </div>

                <div className="border-l-2 border-amber-500/30 pl-4 space-y-3 my-2">
                  {inc.updates.map((upd) => (
                    <div key={upd.id} className="text-xs space-y-1">
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>{upd.timestamp}</span>
                        <span className="text-amber-300 font-semibold">{upd.status.toUpperCase()}</span>
                      </div>
                      <p className="text-slate-200">{upd.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Resolved Incidents */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>历史已处理事件记录</span>
        </h3>

        <div className="space-y-4">
          {pastIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(inc.severity)}
                  <h4 className="font-semibold text-sm text-slate-100">{inc.title}</h4>
                </div>
                {getStatusBadge(inc.status)}
              </div>

              {/* Updates timeline */}
              <div className="border-l-2 border-slate-800 pl-4 space-y-3 pt-1">
                {inc.updates.map((upd) => (
                  <div key={upd.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                      <span>{upd.timestamp}</span>
                      <span className="text-slate-400 font-medium">{upd.status.toUpperCase()}</span>
                    </div>
                    <p className="text-slate-300">{upd.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
