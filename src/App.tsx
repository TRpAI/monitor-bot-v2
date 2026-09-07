import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { StatusBanner } from './components/StatusBanner';
import { NodeList } from './components/NodeList';
import { ServiceList } from './components/ServiceList';
import { IncidentSection } from './components/IncidentSection';
import { Footer } from './components/Footer';
import { api } from './api';
import { MonitorNode, WebService, Incident, TelegramBotConfig, SystemOverview } from './types';
import { initialNodes, initialServices, initialIncidents, initialTelegramConfig } from './mockData';

// Code-split heavy modals and administration panel
const NodeDetailModal = lazy(() => import('./components/NodeDetailModal').then(m => ({ default: m.NodeDetailModal })));
const AdminLoginModal = lazy(() => import('./components/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })));
const DownloadModal = lazy(() => import('./components/DownloadModal').then(m => ({ default: m.DownloadModal })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

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

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingTg, setIsSyncingTg] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Check login state on mount
  useEffect(() => {
    const token = sessionStorage.getItem('monitor_admin_token');
    if (token === 'valid') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Fetch data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getStatus();
      setOverview(data.overview);
      setNodes(data.nodes);
      setServices(data.services);
      setIncidents(data.incidents);

      const tg = await api.getTelegramConfig();
      setTelegramConfig(tg);
    } catch (e) {
      console.error('Failed to load status data:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load & Polling Interval
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadData();
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, loadData]);

  // Sync from Telegram Bot
  const handleTriggerTgSync = async () => {
    setIsSyncingTg(true);
    try {
      const res = await api.syncTelegram();
      await loadData();
    } finally {
      setIsSyncingTg(false);
    }
  };

  // Immediate Single Service Health Check
  const handleCheckService = async (serviceId: string) => {
    const updated = await api.checkService(serviceId);
    if (updated) {
      setServices(prev => prev.map(s => s.id === serviceId ? updated : s));
    }
  };

  // Node operations
  const handleSaveNode = async (node: MonitorNode, isEdit = false) => {
    const saved = await api.saveNode(node, isEdit);
    setNodes(prev => {
      const idx = prev.findIndex(n => n.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    await loadData();
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('确定要删除此节点吗？')) return;
    await api.deleteNode(nodeId);
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    await loadData();
  };

  // Service operations
  const handleSaveService = async (service: WebService, isEdit = false) => {
    const saved = await api.saveService(service, isEdit);
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    await loadData();
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('确定要删除此端点监控吗？')) return;
    await api.deleteService(serviceId);
    setServices(prev => prev.filter(s => s.id !== serviceId));
    await loadData();
  };

  // Incident operations
  const handleSaveIncident = async (incident: Incident, isEdit = false) => {
    const saved = await api.saveIncident(incident, isEdit);
    setIncidents(prev => {
      const idx = prev.findIndex(i => i.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    await loadData();
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (!confirm('确定要删除此事件记录吗？')) return;
    await api.deleteIncident(incidentId);
    setIncidents(prev => prev.filter(i => i.id !== incidentId));
    await loadData();
  };

  // Telegram Config operations
  const handleSaveTelegramConfig = async (config: Partial<TelegramBotConfig>) => {
    const saved = await api.saveTelegramConfig(config);
    setTelegramConfig(saved);
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
  };

  const handleImportData = async (data: any) => {
    if (data.nodes && Array.isArray(data.nodes)) setNodes(data.nodes);
    if (data.services && Array.isArray(data.services)) setServices(data.services);
    if (data.incidents && Array.isArray(data.incidents)) setIncidents(data.incidents);
    alert('配置数据已成功导入并刷新！');
  };

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminView(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem('monitor_admin_token');
    setIsAdminLoggedIn(false);
    setIsAdminView(false);
  };

  // If viewing Admin Console
  if (isAdminView) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <p>正在按需加载管理控制台...</p>
          </div>
        }
      >
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
      </Suspense>
    );
  }

  // Active incidents list (memoized)
  const activeIncidents = useMemo(() => incidents.filter(i => i.status !== 'resolved'), [incidents]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Banner */}
        <StatusBanner
          overview={overview}
          activeIncidents={activeIncidents}
          onTriggerTgSync={handleTriggerTgSync}
          isSyncingTg={isSyncingTg}
          onViewIncidents={() => setActiveTab('incidents')}
        />

        {/* Dynamic Content Views based on Tab */}
        {(activeTab === 'all' || activeTab === 'nodes') && (
          <NodeList
            nodes={nodes}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        )}

        {(activeTab === 'all' || activeTab === 'services') && (
          <ServiceList
            services={services}
            onCheckService={handleCheckService}
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

      {/* Project Download Modal (Lazy loaded on demand) */}
      {isDownloadModalOpen && (
        <Suspense fallback={null}>
          <DownloadModal
            isOpen={isDownloadModalOpen}
            onClose={() => setIsDownloadModalOpen(false)}
            totalNodes={nodes.length}
            totalServices={services.length}
          />
        </Suspense>
      )}

      {/* Node Detail Drawer / Modal (Lazy loaded on demand) */}
      {selectedNode && (
        <Suspense fallback={null}>
          <NodeDetailModal
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </Suspense>
      )}

      {/* Admin Login Modal (Lazy loaded on demand) */}
      {isAdminLoginOpen && (
        <Suspense fallback={null}>
          <AdminLoginModal
            isOpen={isAdminLoginOpen}
            onClose={() => setIsAdminLoginOpen(false)}
            onLoginSuccess={() => {
              setIsAdminLoggedIn(true);
              setIsAdminView(true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
