import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { StatusBanner } from './components/StatusBanner';
import { NodeList } from './components/NodeList';
import { ServiceList } from './components/ServiceList';
import { IncidentSection } from './components/IncidentSection';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api, computeClusterMetrics } from './api';
import { MonitorNode, WebService, Incident, TelegramBotConfig, SystemOverview, ToastNotification } from './types';
import { initialNodes, initialServices, initialIncidents, initialTelegramConfig } from './mockData';
import { NodeDetailModal } from './components/NodeDetailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { DownloadModal } from './components/DownloadModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [overview, setOverview] = useState<SystemOverview>({
    overallStatus: 'operational',
    totalNodes: initialNodes.length,
    onlineNodes: initialNodes.length,
    totalServices: initialServices.length,
    operationalServices: initialServices.length,
    avgLatencyMs: 38,
    overallUptimePercent: 99.98,
    lastUpdated: new Date().toISOString(),
    telegramSync: {
      connected: true,
      lastSyncTime: initialTelegramConfig.lastSyncTime,
      botUsername: initialTelegramConfig.botUsername,
    },
  });

  const [nodes, setNodes] = useState<MonitorNode[]>(initialNodes);
  const [services, setServices] = useState<WebService[]>(initialServices);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [telegramConfig, setTelegramConfig] = useState<TelegramBotConfig>(initialTelegramConfig);

  const [activeTab, setActiveTab] = useState<'all' | 'nodes' | 'services' | 'incidents'>('all');
  const [selectedNode, setSelectedNode] = useState<MonitorNode | null>(null);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingTg, setIsSyncingTg] = useState(false);
  const [isCheckingAllServices, setIsCheckingAllServices] = useState(false);
  const [isRefreshingCluster, setIsRefreshingCluster] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Cluster aggregate compute
  const clusterMetrics = useMemo(() => computeClusterMetrics(nodes), [nodes]);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastNotification = { id, ...toast };
    setToasts(prev => [...prev.slice(-4), newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.durationMs || 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Life-cycle & Abort Controller references
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadDataRef = useRef<() => Promise<void>>(undefined);

  // Check login state and verify token on mount
  useEffect(() => {
    isMountedRef.current = true;
    const verifyAuth = async () => {
      const isValid = await api.verifyAdminToken();
      if (isMountedRef.current) {
        setIsAdminLoggedIn(isValid);
      }
    };
    verifyAuth();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Global Keyboard Shortcuts (Esc to close modals, 1-4 to switch tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '');

      if (e.key === 'Escape') {
        if (selectedNode) setSelectedNode(null);
        if (isAdminLoginOpen) setIsAdminLoginOpen(false);
        if (isDownloadModalOpen) setIsDownloadModalOpen(false);
        return;
      }

      if (!isInput && !isAdminView) {
        if (e.key === '1') setActiveTab('all');
        else if (e.key === '2') setActiveTab('nodes');
        else if (e.key === '3') setActiveTab('services');
        else if (e.key === '4') setActiveTab('incidents');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, isAdminLoginOpen, isDownloadModalOpen, isAdminView]);

  // Fetch data with abort controller & error notification
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await api.getStatus(controller.signal);
      if (!isMountedRef.current) return;

      setOverview(data.overview);
      setNodes(data.nodes);
      setServices(data.services);
      setIncidents(data.incidents);

      if (data.telegramConfig) {
        setTelegramConfig(data.telegramConfig);
      }

      if (data.warning) {
        console.info('[MonitorBot]', data.warning);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return;
      }
      console.warn('Failed to load status data:', e);
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Keep loadDataRef current for polling
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling Interval without closure traps
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadDataRef.current?.();
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  // Sync from Telegram Bot with user feedback
  const handleTriggerTgSync = async () => {
    setIsSyncingTg(true);
    try {
      const res = await api.syncTelegram();
      if (!isMountedRef.current) return;
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Telegram 同步完成',
          message: res.message,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Telegram 同步提醒',
          message: res.message,
        });
      }
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '网络连接超时';
      addToast({
        type: 'error',
        title: '同步请求异常',
        message: msg,
      });
    } finally {
      if (isMountedRef.current) {
        setIsSyncingTg(false);
      }
    }
  };

  // Immediate Single Service Health Check
  const handleCheckService = async (serviceId: string) => {
    const updated = await api.checkService(serviceId);
    if (updated && isMountedRef.current) {
      setServices(prev => prev.map(s => s.id === serviceId ? updated : s));
      addToast({
        type: 'info',
        title: '端点检测完毕',
        message: `${updated.name}: ${updated.status === 'operational' ? '健康在线' : '响应异常'}`,
      });
    }
  };

  // Node operations
  const handleSaveNode = async (node: MonitorNode, isEdit = false) => {
    const saved = await api.saveNode(node, isEdit);
    if (!isMountedRef.current) return;
    setNodes(prev => {
      const idx = prev.findIndex(n => n.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    addToast({
      type: 'success',
      title: isEdit ? '节点已更新' : '节点已添加',
      message: `${node.name} (${node.region || node.host}) 数据已同步`,
    });
    await loadData();
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('确定要删除此节点吗？')) return;
    await api.deleteNode(nodeId);
    if (!isMountedRef.current) return;
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    addToast({ type: 'info', title: '节点已移除' });
    await loadData();
  };

  // Service operations
  const handleSaveService = async (service: WebService, isEdit = false) => {
    const saved = await api.saveService(service, isEdit);
    if (!isMountedRef.current) return;
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    addToast({
      type: 'success',
      title: isEdit ? '端点已更新' : '端点已添加',
      message: `${service.name} (${service.url}) 已保存`,
    });
    await loadData();
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('确定要删除此端点监控吗？')) return;
    await api.deleteService(serviceId);
    if (!isMountedRef.current) return;
    setServices(prev => prev.filter(s => s.id !== serviceId));
    addToast({ type: 'info', title: '监控端点已删除' });
    await loadData();
  };

  // Batch probe all services
  const handleCheckAllServices = async () => {
    setIsCheckingAllServices(true);
    try {
      const updated = await api.checkAllServices();
      if (!isMountedRef.current) return;
      setServices(updated);
      addToast({
        type: 'success',
        title: '全量端点探测完成',
        message: `已同步更新 ${updated.length} 个端点的健康状态与响应延迟`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '网络超时';
      addToast({
        type: 'error',
        title: '探测请求异常',
        message: msg,
      });
    } finally {
      if (isMountedRef.current) {
        setIsCheckingAllServices(false);
      }
    }
  };

  // One-click full cluster health check & speed test
  const handleRefreshCluster = async () => {
    setIsRefreshingCluster(true);
    try {
      await Promise.all([
        loadData(),
        api.checkAllServices().then((svcs) => {
          if (isMountedRef.current) setServices(svcs);
        }).catch(() => {}),
      ]);
      addToast({
        type: 'success',
        title: '集群体检与测速完成',
        message: '已更新全部节点与服务的实时指标',
      });
    } finally {
      if (isMountedRef.current) {
        setIsRefreshingCluster(false);
      }
    }
  };

  // Update single node in place (e.g. from live ping)
  const handleNodeUpdated = useCallback((updatedNode: MonitorNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSelectedNode(prev => (prev?.id === updatedNode.id ? updatedNode : prev));
  }, []);

  // Incident operations
  const handleSaveIncident = async (incident: Incident, isEdit = false) => {
    const saved = await api.saveIncident(incident, isEdit);
    if (!isMountedRef.current) return;
    setIncidents(prev => {
      const idx = prev.findIndex(i => i.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    addToast({
      type: 'success',
      title: isEdit ? '事件已更新' : '事件已发布',
      message: incident.title,
    });
    await loadData();
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (!confirm('确定要删除此事件记录吗？')) return;
    await api.deleteIncident(incidentId);
    if (!isMountedRef.current) return;
    setIncidents(prev => prev.filter(i => i.id !== incidentId));
    addToast({ type: 'info', title: '事件记录已删除' });
    await loadData();
  };

  // Telegram Config operations
  const handleSaveTelegramConfig = async (config: Partial<TelegramBotConfig>) => {
    const saved = await api.saveTelegramConfig(config);
    if (isMountedRef.current) {
      setTelegramConfig(saved);
      addToast({
        type: 'success',
        title: 'Telegram 配置已保存',
        message: '机器人告警与同步设置已即时生效',
      });
    }
  };

  const handleTestBot = async (token: string) => {
    return await api.testTelegramBot(token);
  };

  const handleSendAlert = async (token?: string, chatId?: string) => {
    return await api.sendTestAlert(token, chatId);
  };

  // Export & Import
  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      nodes,
      services,
      incidents,
      telegramConfig: { ...telegramConfig, botToken: '' }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitor-bot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: '配置文件已导出', message: '已下载 JSON 备份' });
  };

  const handleImportData = async (data: any) => {
    try {
      const res = await api.importData(data);
      if (data.nodes && Array.isArray(data.nodes)) setNodes(data.nodes);
      if (data.services && Array.isArray(data.services)) setServices(data.services);
      if (data.incidents && Array.isArray(data.incidents)) setIncidents(data.incidents);
      await loadData();
      addToast({
        type: 'success',
        title: '配置数据已成功导入',
        message: res.message,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '未知解析错误';
      addToast({
        type: 'error',
        title: '导入数据失败',
        message: msg,
      });
    }
  };

  const handleOpenAdmin = () => {
    setIsAdminLoggedIn(true);
    setIsAdminView(true);
  };

  const handleLogoutAdmin = () => {
    api.logoutAdmin();
    setIsAdminLoggedIn(false);
    setIsAdminView(false);
    addToast({
      type: 'info',
      title: '已退出管理控制台',
      message: '已切换至前台展示模式',
    });
  };

  // Active incidents list (memoized) - moved before isAdminView check to ensure consistent hook count
  const activeIncidents = useMemo(() => incidents.filter(i => i.status !== 'resolved'), [incidents]);

  // If viewing Admin Console
  if (isAdminView) {
    return (
      <ErrorBoundary onReset={() => setIsAdminView(false)}>
        <AdminDashboard
          overview={overview}
          nodes={nodes}
          services={services}
          incidents={incidents}
          telegramConfig={telegramConfig}
          onSaveTelegramConfig={handleSaveTelegramConfig}
          onTestBot={handleTestBot}
          onSendAlert={handleSendAlert}
          onSaveNode={handleSaveNode}
          onDeleteNode={handleDeleteNode}
          onSaveService={handleSaveService}
          onDeleteService={handleDeleteService}
          onSaveIncident={handleSaveIncident}
          onDeleteIncident={handleDeleteIncident}
          onTriggerSync={handleTriggerTgSync}
          onBackToPublic={() => setIsAdminView(false)}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onOpenDownload={() => setIsDownloadModalOpen(true)}
        />
        {isDownloadModalOpen && (
          <DownloadModal
            isOpen={isDownloadModalOpen}
            onClose={() => setIsDownloadModalOpen(false)}
            totalNodes={nodes.length}
            totalServices={services.length}
          />
        )}
        <ToastContainer notifications={toasts} onDismiss={removeToast} />
      </ErrorBoundary>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Sticky Header */}
      <Header
        overview={overview}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdmin={handleOpenAdmin}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* System Health Hero Banner */}
        <StatusBanner
          overview={overview}
          activeIncidents={activeIncidents}
          onTriggerTgSync={handleTriggerTgSync}
          isSyncingTg={isSyncingTg}
          onViewIncidents={() => setActiveTab('incidents')}
          clusterMetrics={clusterMetrics}
          onRefreshAll={handleRefreshCluster}
          isRefreshingAll={isRefreshingCluster}
        />

        {/* Section Tabs */}
        {(activeTab === 'all' || activeTab === 'nodes') && (
          <NodeList
            nodes={nodes}
            onSelectNode={setSelectedNode}
            onNodeUpdated={handleNodeUpdated}
          />
        )}

        {(activeTab === 'all' || activeTab === 'services') && (
          <ServiceList
            services={services}
            onCheckService={handleCheckService}
            onCheckAllServices={handleCheckAllServices}
            isCheckingAll={isCheckingAllServices}
          />
        )}

        {(activeTab === 'all' || activeTab === 'incidents') && (
          <IncidentSection
            incidents={incidents}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={handleOpenAdmin}
        botUsername={overview.telegramSync.botUsername}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* Project Download Modal */}
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          totalNodes={nodes.length}
          totalServices={services.length}
        />
      )}

      {/* Node Detail Drawer / Modal */}
      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onNodeUpdated={handleNodeUpdated}
        />
      )}

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onLoginSuccess={() => {
            setIsAdminLoggedIn(true);
            setIsAdminView(true);
            addToast({
              type: 'success',
              title: '管理员验证通过',
              message: '已进入节点与告警管理控制台',
            });
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer notifications={toasts} onDismiss={removeToast} />
    </div>
  );
}
