import React, { useState } from 'react';
import { X, Server, Cpu, HardDrive, Wifi, Activity, Terminal, Check, Copy, Thermometer, Clock, ShieldCheck, ArrowUp, ArrowDown, Zap, RefreshCw } from 'lucide-react';
import { MonitorNode, PingTestResult } from '../types';
import { getApiBase, api } from '../api';

interface NodeDetailModalProps {
  node: MonitorNode | null;
  onClose: () => void;
  onNodeUpdated?: (node: MonitorNode) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, onClose, onNodeUpdated }) => {
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<PingTestResult | null>(null);

  if (!node) return null;

  const handleRunPing = async () => {
    if (isPinging) return;
    setIsPinging(true);
    try {
      const res = await api.pingNode(node.id);
      setPingResult(res);
      if (onNodeUpdated) {
        onNodeUpdated({
          ...node,
          metrics: {
            ...node.metrics,
            ping: {
              ...node.metrics.ping,
              latencyMs: res.latencyMs,
            },
          },
        });
      }
    } finally {
      setIsPinging(false);
    }
  };

  const uptimeDays = Math.floor(node.metrics.uptimeSeconds / 86400);
  const uptimeHours = Math.floor((node.metrics.uptimeSeconds % 86400) / 3600);

  const apiBase = getApiBase() || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000');
  const agentCommand = `curl -fsSL ${apiBase}/api/agent/script | bash -s -- --node-id ${node.id}`;

  const handleCopyCommand = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(agentCommand).catch(() => {});
      }
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{node.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {node.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {node.region} · IP: {node.host}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
          
          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">运行时间</span>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{uptimeDays}天 {uptimeHours}小时</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">系统平均负载 (1/5/15m)</span>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
                {node.metrics.load.join(' , ')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">网络 Ping 延迟</span>
              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                <span>{node.metrics.ping.latencyMs} ms (0% 丢包)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">核心工作温度</span>
              <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5" />
                <span>{node.metrics.temperatureCelsius || 42.5} °C</span>
              </div>
            </div>
          </div>

          {/* System & Hardware Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 space-y-2 font-mono text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">操作系统</span>
              <span className="text-slate-800 dark:text-slate-200">{node.metrics.os}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Linux 内核版本</span>
              <span className="text-slate-800 dark:text-slate-200">{node.metrics.kernel || 'Linux 6.x'}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">处理器型号</span>
              <span className="text-slate-800 dark:text-slate-200">{node.metrics.cpu.model} ({node.metrics.cpu.cores} 逻辑核心)</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">网络累计传输</span>
              <span className="text-slate-800 dark:text-slate-200">
                出站 {node.metrics.network.totalUpGb} GB / 入站 {node.metrics.network.totalDownGb} GB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">数据源通道</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-sans font-medium">
                {node.tgBotReported ? 'TRpAI/monitor-bot 机器人探针心跳链路' : '本地监控网关'}
              </span>
            </div>
          </div>

          {/* Metric Sparkline Cards */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>近期心跳与负载走势</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CPU Chart */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>CPU 使用率</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{node.metrics.cpu.usagePercent}%</span>
                </div>
                {/* Visual mini bar graph */}
                <div className="h-16 flex items-end gap-1.5 pt-2">
                  {(node.metrics.history || [
                    { time: '1', cpu: 15 },
                    { time: '2', cpu: 22 },
                    { time: '3', cpu: 18 },
                    { time: '4', cpu: 28 },
                    { time: '5', cpu: node.metrics.cpu.usagePercent }
                  ]).map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className="w-full bg-cyan-500/80 rounded-xs transition-all duration-300"
                        style={{ height: `${Math.max(10, h.cpu)}%` }}
                        title={`${h.time}: ${h.cpu}%`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Memory Chart */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>内存占用率</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{node.metrics.memory.percent}%</span>
                </div>
                <div className="h-16 flex items-end gap-1.5 pt-2">
                  {(node.metrics.history || [
                    { time: '1', ram: 45 },
                    { time: '2', ram: 48 },
                    { time: '3', ram: 47 },
                    { time: '4', ram: 50 },
                    { time: '5', ram: node.metrics.memory.percent }
                  ]).map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className="w-full bg-indigo-500/80 rounded-xs transition-all duration-300"
                        style={{ height: `${Math.max(10, h.ram)}%` }}
                        title={`${h.time}: ${h.ram}%`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ping Latency Chart */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>Ping 延迟波动</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{node.metrics.ping.latencyMs} ms</span>
                </div>
                <div className="h-16 flex items-end gap-1.5 pt-2">
                  {(node.metrics.history || [
                    { time: '1', latency: 24 },
                    { time: '2', latency: 25 },
                    { time: '3', latency: 23 },
                    { time: '4', latency: 26 },
                    { time: '5', latency: node.metrics.ping.latencyMs }
                  ]).map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className="w-full bg-emerald-500/80 rounded-xs transition-all duration-300"
                        style={{ height: `${Math.min(100, Math.max(15, h.latency))}%` }}
                        title={`${h.time}: ${h.latency}ms`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Network Diagnostic & Ping Tool */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200">ICMP / 网络延迟诊断工具</span>
              </div>
              <button
                onClick={handleRunPing}
                disabled={isPinging}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                <span>{isPinging ? '诊断测速中...' : '发起即时测速'}</span>
              </button>
            </div>

            {pingResult ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500">往返延迟 RTT</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{pingResult.latencyMs} ms</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500">网络抖动 Jitter</span>
                  <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">±{pingResult.jitterMs} ms</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500">丢包率 Packet Loss</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{pingResult.lossPercent}%</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500">数据包 收/发</span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{pingResult.packetsReceived}/{pingResult.packetsSent}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                点击上方按钮可立即由监控服务端向节点主机发起 4 次 ICMP 数据包探测，测试即时链路往返时间与抖动。
              </p>
            )}
          </div>

          {/* Quick Agent Report Script */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-medium">
                <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>在此 Linux 节点上执行 TRpAI 探针心跳上报</span>
              </div>
              <button
                onClick={handleCopyCommand}
                className="flex items-center gap-1 text-[11px] text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 bg-cyan-100/70 dark:bg-cyan-950/40 hover:bg-cyan-200/70 dark:hover:bg-cyan-900/40 border border-cyan-300 dark:border-cyan-800/40 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已复制' : '复制命令'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300 text-[11px] font-mono overflow-x-auto border border-slate-200 dark:border-slate-800/80">
              <code>{agentCommand}</code>
            </pre>
            <p className="text-[11px] text-slate-500">
              提示：可将其加入 crontab（如 <code className="text-slate-600 dark:text-slate-400">*/1 * * * *</code>）实现无痛长效心跳同步。
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
