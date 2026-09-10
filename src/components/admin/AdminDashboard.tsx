import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bot,
  Server,
  Globe,
  AlertOctagon,
  Cloud,
  Settings,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Send,
  Check,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  ArrowLeft,
  Activity,
  Cpu,
  Wifi,
  Thermometer,
} from 'lucide-react';
import { MonitorNode, WebService, Incident, TelegramBotConfig, SystemOverview } from '../../types';
import { getApiBase, setApiBase } from '../../api';
import { initialTelegramConfig } from '../../mockData';
import { DeploymentGuide } from './DeploymentGuide';
import { ThemeToggle } from '../ThemeToggle';

interface AdminDashboardProps {
  overview?: SystemOverview;
  nodes?: MonitorNode[];
  services?: WebService[];
  incidents?: Incident[];
  telegramConfig?: TelegramBotConfig;
  onSaveTelegramConfig: (config: Partial<TelegramBotConfig>) => Promise<void>;
  onTestBot: (token: string) => Promise<{ success: boolean; message: string; botUsername?: string }>;
  onSendAlert: (token?: string, chatId?: string) => Promise<{ success: boolean; message: string; preview?: string }>;
  onSaveNode: (node: MonitorNode, isEdit?: boolean) => Promise<void>;
  onDeleteNode: (nodeId: string) => Promise<void>;
  onSaveService: (service: WebService, isEdit?: boolean) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onSaveIncident: (incident: Incident, isEdit?: boolean) => Promise<void>;
  onDeleteIncident: (incidentId: string) => Promise<void>;
  onTriggerSync: () => Promise<void>;
  onBackToPublic: () => void;
  onExportData: () => void;
  onImportData: (data: any) => Promise<void>;
  onOpenDownload?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  overview,
  nodes = [],
  services = [],
  incidents = [],
  telegramConfig = initialTelegramConfig,
  onSaveTelegramConfig,
  onTestBot,
  onSendAlert,
  onSaveNode,
  onDeleteNode,
  onSaveService,
  onDeleteService,
  onSaveIncident,
  onDeleteIncident,
  onTriggerSync,
  onBackToPublic,
  onExportData,
  onImportData,
  onOpenDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'telegram' | 'nodes' | 'services' | 'incidents' | 'deployment' | 'backup'>('overview');

  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeServices = Array.isArray(services) ? services : [];
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safeConfig = telegramConfig || initialTelegramConfig;

  // Telegram states - completely safe against undefined or missing nested properties
  const [tgForm, setTgForm] = useState({
    botToken: safeConfig.botToken || '',
    chatId: safeConfig.chatId || '',
    autoSync: safeConfig.autoSync ?? true,
    syncIntervalSec: safeConfig.syncIntervalSec ?? 30,
    alertOnNodeOffline: safeConfig.alertOnNodeOffline ?? true,
    alertOnHighLoad: safeConfig.alertOnHighLoad ?? true,
    cpuThreshold: safeConfig.thresholds?.cpuPercent ?? 85,
    memThreshold: safeConfig.thresholds?.memoryPercent ?? 90,
    tempThreshold: safeConfig.thresholds?.tempCelsius ?? 75,
  });

  // Keep tgForm synced when telegramConfig updates asynchronously
  useEffect(() => {
    if (telegramConfig) {
      setTgForm({
        botToken: telegramConfig.botToken || '',
        chatId: telegramConfig.chatId || '',
        autoSync: telegramConfig.autoSync ?? true,
        syncIntervalSec: telegramConfig.syncIntervalSec ?? 30,
        alertOnNodeOffline: telegramConfig.alertOnNodeOffline ?? true,
        alertOnHighLoad: telegramConfig.alertOnHighLoad ?? true,
        cpuThreshold: telegramConfig.thresholds?.cpuPercent ?? 85,
        memThreshold: telegramConfig.thresholds?.memoryPercent ?? 90,
        tempThreshold: telegramConfig.thresholds?.tempCelsius ?? 75,
      });
    }
  }, [telegramConfig]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backend API URL State (Useful when frontend is on Cloudflare Pages and backend is on VPS)
  const [customApiUrl, setCustomApiUrl] = useState<string>(getApiBase());
  const [apiBaseSaved, setApiBaseSaved] = useState(false);

  // Node Modal State
  const [editingNode, setEditingNode] = useState<MonitorNode | null>(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);

  // Service Modal State
  const [editingService, setEditingService] = useState<WebService | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Incident Modal State
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Handler: Save TG Config
  const handleSaveTg = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveTelegramConfig({
      botToken: tgForm.botToken,
      chatId: tgForm.chatId,
      autoSync: tgForm.autoSync,
      syncIntervalSec: tgForm.syncIntervalSec,
      alertOnNodeOffline: tgForm.alertOnNodeOffline,
      alertOnHighLoad: tgForm.alertOnHighLoad,
      thresholds: {
        cpuPercent: tgForm.cpuThreshold,
        memoryPercent: tgForm.memThreshold,
        diskPercent: 90,
        tempCelsius: tgForm.tempThreshold,
        latencyMs: 300,
      }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Handler: Test Bot
  const handleTestBot = async () => {
    setIsTestingBot(true);
    setTestResult(null);
    const res = await onTestBot(tgForm.botToken);
    setTestResult(res.message);
    setIsTestingBot(false);
  };

  // Handler: Send Alert
  const handleSendAlert = async () => {
    setIsSendingAlert(true);
    setTestResult(null);
    const res = await onSendAlert(tgForm.botToken, tgForm.chatId);
    setTestResult(res.message);
    setIsSendingAlert(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      
      {/* Top Admin Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Layout fix: Added min-w-0 shrink-0 to prevent button compression */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
            
            {/* Left Top: Return Button & Dashboard Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
              <button
                onClick={onBackToPublic}
                title="返回前台公开监控看板"
                className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:active:bg-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">返回前台看板</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white whitespace-nowrap">
                  MonitorBot <span className="hidden sm:inline">后台管理</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 whitespace-nowrap shrink-0 hidden md:inline">
                  DevOps
                </span>
              </div>
            </div>

            {/* Right Top: Tools, Theme Toggle, Download & Sync */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden xl:inline whitespace-nowrap truncate max-w-[200px]">
                TG 机器人: <strong className="text-cyan-600 dark:text-cyan-400">{safeConfig.botUsername || '@TRpAI_MonitorBot'}</strong>
              </span>
              <ThemeToggle className="shrink-0" />
              {onOpenDownload && (
                <button
                  onClick={onOpenDownload}
                  className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200/80 dark:bg-cyan-950/80 dark:hover:bg-cyan-900/90 dark:active:bg-cyan-800/90 text-cyan-700 dark:text-cyan-300 px-2.5 sm:px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150"
                  title="打包下载项目全部文件与信息"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="whitespace-nowrap">打包下载</span>
                </button>
              )}
              <button
                onClick={onTriggerSync}
                className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/30 dark:active:bg-cyan-500/40 text-slate-700 dark:text-cyan-300 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-cyan-500/40 cursor-pointer shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150"
                title="从 Telegram 机器人同步最新数据"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">同步数据</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Content & Sidebar Tabs */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Admin Tab Navigation */}
          <div className="lg:col-span-1 flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-1 lg:pb-0 gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150 whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] active:bg-cyan-100/80 dark:active:bg-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:shadow-2xs active:bg-slate-200/80 dark:active:bg-slate-800 active:scale-[0.98] border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>控制台概览</span>
            </button>

            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex items-center gap-2 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150 whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'telegram'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] active:bg-cyan-100/80 dark:active:bg-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:shadow-2xs active:bg-slate-200/80 dark:active:bg-slate-800 active:scale-[0.98] border border-transparent'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span>TG Bot 集成</span>
            </button>

            <button
              onClick={() => setActiveTab('nodes')}
              className={`flex items-center justify-between gap-2 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150 whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'nodes'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] active:bg-cyan-100/80 dark:active:bg-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:shadow-2xs active:bg-slate-200/80 dark:active:bg-slate-800 active:scale-[0.98] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 shrink-0" />
                <span>节点管理</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                {safeNodes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center justify-between gap-2 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150 whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] active:bg-cyan-100/80 dark:active:bg-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:shadow-2xs active:bg-slate-200/80 dark:active:bg-slate-800 active:scale-[0.98] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 shrink-0" />
                <span>服务端点</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                {safeServices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center justify-between gap-2 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150 whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'incidents'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] active:bg-cyan-100/80 dark:active:bg-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:shadow-2xs active:bg-slate-200/80 dark:active:bg-slate-800 active:scale-[0.98] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>事件维护</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                {safeIncidents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('deployment')}
              className={`flex items-center gap-2 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150 whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'deployment'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] active:bg-cyan-100/80 dark:active:bg-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:shadow-2xs active:bg-slate-200/80 dark:active:bg-slate-800 active:scale-[0.98] border border-transparent'
              }`}
            >
              <Cloud className="w-4 h-4 shrink-0" />
              <span>部署中心</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-150 whitespace-nowrap shrink-0 lg:w-full cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold shadow-xs hover:shadow-sm active:scale-[0.98] active:bg-cyan-100/80 dark:active:bg-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 hover:shadow-2xs active:bg-slate-200/80 dark:active:bg-slate-800 active:scale-[0.98] border border-transparent'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>数据备份</span>
            </button>
          </div>

          {/* Right Panel Main View */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">控制台运行总览</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    汇集 TRpAI/monitor-bot 机器人链路、服务器集群与网络端点健康状态
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">探针节点在线率</span>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      {overview?.onlineNodes ?? safeNodes.filter(n => n.status === 'online').length} / {overview?.totalNodes ?? safeNodes.length} 在线
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">各机房探针均处于保活监听状态</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">HTTP/TCP 服务端点</span>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      {overview?.operationalServices ?? safeServices.filter(s => s.status === 'operational').length} / {overview?.totalServices ?? safeServices.length} 正常
                    </div>
                    <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1">平均网络延迟: {overview?.avgLatencyMs ?? 25} ms</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Telegram 机器人通道</span>
                    <div className="text-xl font-bold font-mono text-cyan-700 dark:text-cyan-300 mt-1">
                      已联通
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      {safeConfig.botUsername || '@TRpAI_MonitorBot'}
                    </p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">快捷操作</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveTab('telegram')}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      配置 Telegram Bot 凭据
                    </button>
                    <button
                      onClick={() => {
                        setEditingNode(null);
                        setIsNodeModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200/80 dark:bg-cyan-600/20 dark:hover:bg-cyan-600/30 dark:active:bg-cyan-600/40 text-cyan-700 dark:text-cyan-300 text-xs border border-cyan-200 dark:border-cyan-500/40 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      + 添加受控服务器节点
                    </button>
                    <button
                      onClick={() => {
                        setEditingService(null);
                        setIsServiceModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200/80 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 dark:active:bg-emerald-600/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-500/40 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      + 添加新 HTTP/TCP 探测
                    </button>
                    <button
                      onClick={() => setActiveTab('deployment')}
                      className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 active:bg-orange-200/80 dark:bg-orange-600/20 dark:hover:bg-orange-600/30 dark:active:bg-orange-600/40 text-orange-700 dark:text-orange-300 text-xs border border-orange-200 dark:border-orange-500/40 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      查看 Cloudflare / Docker 部署配置
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Telegram Bot Center Tab */}
            {activeTab === 'telegram' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span>Telegram Bot 集成与告警推送中心</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    对接 TRpAI/monitor-bot 机器人，实现心跳指标同步、异常告警与群组命令交互
                  </p>
                </div>

                <form onSubmit={handleSaveTg} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        Telegram Bot Token
                      </label>
                      <input
                        type="text"
                        placeholder="例如: 123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
                        value={tgForm.botToken}
                        onChange={(e) => setTgForm({ ...tgForm, botToken: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500/60"
                      />
                      <p className="text-[11px] text-slate-500">
                        在 Telegram 中联系 @BotFather 创建机器人获取
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        告警推送 Chat ID / 频道 ID
                      </label>
                      <input
                        type="text"
                        placeholder="例如: -1001234567890 或 987654321"
                        value={tgForm.chatId}
                        onChange={(e) => setTgForm({ ...tgForm, chatId: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500/60"
                      />
                      <p className="text-[11px] text-slate-500">
                        Bot 所在群组或频道的 ID（通过 @userinfobot 查询）
                      </p>
                    </div>
                  </div>

                  {/* Thresholds */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">自动化告警阈值配置</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="text-slate-600 dark:text-slate-400 block mb-1">CPU 告警线 (%)</label>
                        <input
                          type="number"
                          value={tgForm.cpuThreshold}
                          onChange={(e) => setTgForm({ ...tgForm, cpuThreshold: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 dark:text-slate-400 block mb-1">内存占用告警线 (%)</label>
                        <input
                          type="number"
                          value={tgForm.memThreshold}
                          onChange={(e) => setTgForm({ ...tgForm, memThreshold: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 dark:text-slate-400 block mb-1">温度告警线 (°C)</label>
                        <input
                          type="number"
                          value={tgForm.tempThreshold}
                          onChange={(e) => setTgForm({ ...tgForm, tempThreshold: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Tests */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestBot}
                        disabled={isTestingBot}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingBot ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
                        <span>测试 Bot 连通性</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendAlert}
                        disabled={isSendingAlert}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        <Send className={`w-3.5 h-3.5 ${isSendingAlert ? 'animate-pulse text-amber-500' : ''}`} />
                        <span>发送测试告警</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {saveSuccess && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>保存成功</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:active:bg-cyan-600 text-white dark:text-slate-950 font-bold text-xs shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer"
                      >
                        保存配置
                      </button>
                    </div>
                  </div>

                  {testResult && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-cyan-700 dark:text-cyan-300">
                      {testResult}
                    </div>
                  )}
                </form>

                {/* Webhook & monitor-bot Command Guide */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Webhook 接口与 TG 机器人交互指令</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    在 Telegram 中向您的机器人发送以下指令可即时查询：
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <strong className="text-cyan-600 dark:text-cyan-400">/status</strong> - 返回全部节点简报与服务状态
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <strong className="text-cyan-600 dark:text-cyan-400">/nodes</strong> - 查看当前探针节点在线列表及 IP
                    </div>
                  </div>
                </div>

                {/* Cloudflare Pages / Cross-Origin VPS Backend URL setting */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50/50 to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-orange-200/60 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Cloud className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                        <span>Cloudflare Pages 静态托管与自有 VPS 后端联动配置</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        若您将前端发布在 Cloudflare Pages 静态 CDN 上，可在此配置您的真实 VPS 后端地址进行跨域连接；若留空则自动使用内置边缘模式。
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="例如: https://api.yourdomain.com 或 http://1.2.3.4:3000 (留空为边缘/同源模式)"
                      value={customApiUrl}
                      onChange={(e) => {
                        setCustomApiUrl(e.target.value);
                        setApiBaseSaved(false);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setApiBase(customApiUrl);
                          setApiBaseSaved(true);
                          setTimeout(() => setApiBaseSaved(false), 3000);
                        }}
                        className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:active:bg-cyan-600 text-white dark:text-slate-950 font-medium text-xs shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 shrink-0 cursor-pointer"
                      >
                        保存连接地址
                      </button>
                      {customApiUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomApiUrl('');
                            setApiBase('');
                            setApiBaseSaved(true);
                            setTimeout(() => setApiBaseSaved(false), 3000);
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 shrink-0 cursor-pointer"
                        >
                          恢复默认边缘模式
                        </button>
                      )}
                    </div>
                  </div>
                  {apiBaseSaved && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>后端地址已更新并保存在本地浏览器中，后续请求将直接使用该地址。</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 3. Nodes Management Tab */}
            {activeTab === 'nodes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">受控服务器节点管理</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">添加、编辑或删除监控探针节点</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingNode(null);
                      setIsNodeModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:active:bg-cyan-600 text-white dark:text-slate-950 font-bold text-xs shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">添加节点</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">名称</th>
                        <th className="py-2.5 px-3">区域 / 主机</th>
                        <th className="py-2.5 px-3">类型</th>
                        <th className="py-2.5 px-3">状态</th>
                        <th className="py-2.5 px-3 text-right">管理操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {safeNodes.map((node) => (
                        <tr key={node.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{node.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{node.region} ({node.host})</td>
                          <td className="py-2.5 px-3 uppercase font-mono text-slate-500 dark:text-slate-400">{node.type}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${node.status === 'online' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                              {node.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingNode(node);
                                setIsNodeModalOpen(true);
                              }}
                              className="p-1 rounded text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 active:bg-cyan-100 dark:active:bg-cyan-900/60 active:scale-90 transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                              title="编辑"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => onDeleteNode(node.id)}
                              className="p-1 rounded text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 active:bg-rose-100 dark:active:bg-rose-900/60 active:scale-90 transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Services Management Tab */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">HTTP / TCP 端点监控管理</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">配置检测目标、请求方法与告警分组</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setIsServiceModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:active:bg-emerald-600 text-white dark:text-slate-950 font-bold text-xs shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">添加端点</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">服务名称</th>
                        <th className="py-2.5 px-3">目标 URL / 地址</th>
                        <th className="py-2.5 px-3">分组</th>
                        <th className="py-2.5 px-3">90天可用率</th>
                        <th className="py-2.5 px-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {safeServices.map((svc) => (
                        <tr key={svc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{svc.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs">{svc.url}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{svc.group}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{svc.uptime90d}%</td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingService(svc);
                                setIsServiceModalOpen(true);
                              }}
                              className="p-1 rounded text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 active:bg-cyan-100 dark:active:bg-cyan-900/60 active:scale-90 transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                              title="编辑"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => onDeleteService(svc.id)}
                              className="p-1 rounded text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 active:bg-rose-100 dark:active:bg-rose-900/60 active:scale-90 transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Incident Management Tab */}
            {activeTab === 'incidents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">系统事件与维护公告发布</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">公开通知上游割接、机房维护与故障进展</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingIncident(null);
                      setIsIncidentModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">发布新事件</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {safeIncidents.map((inc) => (
                    <div key={inc.id} className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inc.severity}
                          </span>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{inc.title}</h4>
                          <span className="text-xs text-slate-500 font-mono">({inc.createdAt})</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          最新状态: <strong className="text-cyan-600 dark:text-cyan-300">{inc.status}</strong> · {inc.updates?.[0]?.message || '无详细更新'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingIncident(inc);
                            setIsIncidentModalOpen(true);
                          }}
                          className="p-1.5 rounded text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 active:bg-cyan-100 dark:active:bg-cyan-900/60 active:scale-90 transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteIncident(inc.id)}
                          className="p-1.5 rounded text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 active:bg-rose-100 dark:active:bg-rose-900/60 active:scale-90 transition-all duration-150 cursor-pointer inline-flex items-center justify-center"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Deployment Center Tab */}
            {activeTab === 'deployment' && (
              <DeploymentGuide />
            )}

            {/* 7. Backup & System Tab */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">系统备份与全量源码导出</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    支持一键打包下载完整前端源码、Express后端服务、Docker与Cloudflare配置、说明文档及实时遥测数据
                  </p>
                </div>

                {/* Primary Full Project ZIP Card */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-50/70 via-white to-slate-50 dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-950 border border-cyan-200 dark:border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">一键打包下载完整项目 (ZIP)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                        全量源码+配置
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                      直接打包导出包含前端 React 19、Express 服务端、Dockerfile、Docker Compose、Cloudflare Pages 配置、Nginx 模板、Linux Agent 脚本及说明文档在内的完整压缩包。
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenDownload) {
                        onOpenDownload();
                      } else {
                        window.location.href = `${getApiBase()}/api/download/project.zip`;
                      }
                    }}
                    className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:active:bg-cyan-600 text-white dark:text-slate-950 text-xs font-semibold shadow-md hover:shadow-lg active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>打包下载 ZIP 源码包</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-2xs">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">项目说明指南 (Markdown)</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        下载 PROJECT_INFO.md 文档，包含架构全景、API 清单与部署操作指南。
                      </p>
                    </div>
                    <a
                      href={`${getApiBase()}/api/download/project-info.md`}
                      download="PROJECT_INFO.md"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span>下载项目文档 (.md)</span>
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-2xs">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">导出当前配置数据</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        将所有节点、服务端点、阈值设置与历史事件打包导出为 JSON 文件。
                      </p>
                    </div>
                    <button
                      onClick={onExportData}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>导出 JSON 配置文件</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-2xs">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">导入配置恢复</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        选择已备份的 JSON 文件覆盖恢复当前系统数据。
                      </p>
                    </div>
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner transition-all duration-150 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>选择并导入 JSON 文件</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const parsed = JSON.parse(event.target?.result as string);
                                onImportData(parsed);
                              } catch {
                                alert('JSON 解析失败，请检查文件格式');
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- Node Edit / Create Modal --- */}
      {isNodeModalOpen && (
        <NodeEditModal
          node={editingNode}
          onClose={() => setIsNodeModalOpen(false)}
          onSave={async (saved) => {
            await onSaveNode(saved, !!editingNode);
            setIsNodeModalOpen(false);
          }}
        />
      )}

      {/* --- Service Edit / Create Modal --- */}
      {isServiceModalOpen && (
        <ServiceEditModal
          service={editingService}
          onClose={() => setIsServiceModalOpen(false)}
          onSave={async (saved) => {
            await onSaveService(saved, !!editingService);
            setIsServiceModalOpen(false);
          }}
        />
      )}

      {/* --- Incident Edit / Create Modal --- */}
      {isIncidentModalOpen && (
        <IncidentEditModal
          incident={editingIncident}
          onClose={() => setIsIncidentModalOpen(false)}
          onSave={async (saved) => {
            await onSaveIncident(saved, !!editingIncident);
            setIsIncidentModalOpen(false);
          }}
        />
      )}

    </div>
  );
};

// Submodal: Node Edit
const NodeEditModal: React.FC<{
  node: MonitorNode | null;
  onClose: () => void;
  onSave: (node: MonitorNode) => void;
}> = ({ node, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<MonitorNode>>({
    id: node?.id || `node-${Date.now().toString(36)}`,
    name: node?.name || '',
    host: node?.host || '',
    region: node?.region || '亚太自建机房',
    countryCode: node?.countryCode || 'HK',
    type: node?.type || 'vps',
    status: node?.status || 'online',
    tags: node?.tags || ['TG-Bot直报'],
    metrics: node?.metrics || {
      cpu: { usagePercent: 15, cores: 4, model: 'AMD EPYC' },
      memory: { usedMb: 2048, totalMb: 4096, percent: 50 },
      disk: { usedGb: 20, totalGb: 80, percent: 25 },
      network: { upSpeedKb: 200, downSpeedKb: 600, totalUpGb: 10, totalDownGb: 30 },
      load: [0.2, 0.2, 0.2],
      ping: { latencyMs: 35, lossPercent: 0 },
      uptimeSeconds: 86400,
      temperatureCelsius: 41.5,
      os: 'Debian 12',
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.host) return alert('请填写节点名称与主机地址');
    onSave(form as MonitorNode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{node ? '编辑节点' : '添加新监控节点'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">节点标识名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如: HK-Edge-Master-01"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">IP 或 域名</label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="例如: 185.199.108.153"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">所属地区</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="例如: 中国香港 CN2 GIA"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">节点类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="vps">VPS 云服务器</option>
                <option value="dedicated">独立物理机</option>
                <option value="docker">Docker 容器</option>
                <option value="rpi">树莓派 / ARM 探针</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">国家/地区国旗码</label>
              <select
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="HK">中国香港 (HK)</option>
                <option value="JP">日本 (JP)</option>
                <option value="US">美国 (US)</option>
                <option value="SG">新加坡 (SG)</option>
                <option value="DE">德国 (DE)</option>
                <option value="CN">中国大陆 (CN)</option>
                <option value="UN">全球/未知 (UN)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold transition-colors cursor-pointer"
            >
              保存节点
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Submodal: Service Edit
const ServiceEditModal: React.FC<{
  service: WebService | null;
  onClose: () => void;
  onSave: (service: WebService) => void;
}> = ({ service, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<WebService>>({
    id: service?.id || `svc-${Date.now().toString(36)}`,
    name: service?.name || '',
    url: service?.url || '',
    group: service?.group || '核心API',
    method: service?.method || 'GET',
    intervalSec: service?.intervalSec || 30,
    status: service?.status || 'operational',
    statusCode: service?.statusCode || 200,
    latencyMs: service?.latencyMs || 25,
    sslValid: service?.sslValid ?? true,
    sslExpiryDays: service?.sslExpiryDays || 90,
    uptime90d: service?.uptime90d || 100.0,
    description: service?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.url) return alert('请填写服务名称和目标地址');
    onSave(form as WebService);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{service ? '编辑探测端点' : '添加探测端点'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">服务名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如: Public API Gateway"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">探测目标 URL (HTTP / TCP)</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://api.example.com/health"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">分组分类</label>
              <select
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="核心API">核心API</option>
                <option value="Telegram服务">Telegram服务</option>
                <option value="公共前端">公共前端</option>
                <option value="鉴权与安全">鉴权与安全</option>
                <option value="数据库与缓存">数据库与缓存</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">请求方式</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="TCP">TCP 端口检测</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold transition-colors cursor-pointer"
            >
              保存端点
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Submodal: Incident Edit
const IncidentEditModal: React.FC<{
  incident: Incident | null;
  onClose: () => void;
  onSave: (incident: Incident) => void;
}> = ({ incident, onClose, onSave }) => {
  const [title, setTitle] = useState(incident?.title || '');
  const [severity, setSeverity] = useState<Incident['severity']>(incident?.severity || 'minor');
  const [status, setStatus] = useState<Incident['status']>(incident?.status || 'investigating');
  const [message, setMessage] = useState(incident?.updates?.[0]?.message || '已确认异常，工程师正在紧急排查。');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const item: Incident = {
      id: incident?.id || `inc-${Date.now().toString(36)}`,
      title,
      severity,
      status,
      affectedServices: incident?.affectedServices || [],
      createdAt: incident?.createdAt || now,
      updatedAt: now,
      updates: [
        {
          id: `u-${Date.now().toString(36)}`,
          timestamp: now,
          status,
          message,
        },
        ...(incident?.updates || [])
      ]
    };
    onSave(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{incident ? '更新事件信息' : '发布新事件公告'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">事件标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: 核心数据库计划维护"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">影响级别</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="critical">严重中断 (Critical)</option>
                <option value="major">主要影响 (Major)</option>
                <option value="minor">轻度异常 (Minor)</option>
                <option value="maintenance">计划维护 (Maintenance)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">当前处置状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="investigating">正在调查 (Investigating)</option>
                <option value="identified">原因已查明 (Identified)</option>
                <option value="monitoring">观察恢复中 (Monitoring)</option>
                <option value="resolved">已恢复解决 (Resolved)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-medium">最新进展播报内容</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold transition-colors cursor-pointer"
            >
              发布公告
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
