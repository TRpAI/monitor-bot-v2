import { MonitorNode, WebService, Incident, TelegramBotConfig, SystemOverview } from './types';
import { initialNodes, initialServices, initialIncidents, initialTelegramConfig } from './mockData';
import { safeLocalStorage } from './utils/safeStorage';

/**
 * Normalize an API node (flat metrics + specs) into the MonitorNode type
 * that all frontend components expect.
 */
function normalizeNode(raw: any): MonitorNode {
  const region = raw.region || '';
  const countryCodeMatch = region.match(/\b(HK|JP|US|SG|DE|CN|UN)\b/i);
  const countryCode = (countryCodeMatch ? countryCodeMatch[1].toUpperCase() : region.slice(0, 2).toUpperCase()) || 'UN';

  const m = raw.metrics || {};
  const sp = raw.specs || {};
  const cpuNorm = typeof m.cpu === 'number' ? m.cpu : (m.cpu?.usagePercent ?? 0);
  const memNorm = typeof m.memory === 'number' ? m.memory : (m.memory?.percent ?? 0);
  const diskNorm = typeof m.disk === 'number' ? m.disk : (m.disk?.percent ?? 0);
  const pingMs = m.ping?.latencyMs ?? Math.round((m.ping?.latencyBps ?? 0) / 1000);

  return {
    id: raw.id,
    name: raw.name,
    host: raw.ip || raw.host || '',
    region,
    countryCode,
    type: raw.type || 'vps',
    status: raw.status,
    lastSeen: raw.lastHeartbeat
      ? (() => { const d = new Date(raw.lastHeartbeat); const mins = Math.round((Date.now() - d.getTime()) / 60000); return mins < 1 ? '刚刚' : `${mins}分钟前`; })()
      : '刚刚',
    tags: raw.tags || [],
    tgBotReported: raw.tgBotReported ?? false,
    uptimePercent: raw.uptimePercent ?? 99.9,
    metrics: {
      cpu: { usagePercent: cpuNorm, cores: sp.cpuCores || 4, model: sp.cpuModel || '' },
      memory: {
        usedMb: Math.round((memNorm / 100) * (sp.ramTotalGb || 8) * 1024),
        totalMb: (sp.ramTotalGb || 8) * 1024,
        percent: memNorm,
      },
      swap: { usedMb: 0, totalMb: 0, percent: 0 },
      disk: {
        usedGb: sp.diskTotalGb ? Math.round((diskNorm / 100) * sp.diskTotalGb * 10) / 10 : 0,
        totalGb: sp.diskTotalGb || 100,
        percent: diskNorm,
      },
      network: {
        upSpeedKb: Math.round((m.networkOutBps || 0) / 1000 / 8),
        downSpeedKb: Math.round((m.networkInBps || 0) / 1000 / 8),
        totalUpGb: 0,
        totalDownGb: 0,
      },
      load: [0, 0, 0],
      ping: { latencyMs: pingMs, lossPercent: m.ping?.packetLoss ?? 0 },
      uptimeSeconds: 0,
      temperatureCelsius: 0,
      os: sp.os || '',
      kernel: '',
      ip: raw.ip || '',
      history: [],
    },
    history90d: raw.history90Days?.map((h: any) => ({
      date: h.date,
      status: h.uptimePercent >= 99.5 ? 'operational' : h.uptimePercent >= 95 ? 'degraded' : 'outage',
      uptimePercent: h.uptimePercent,
    })) || [],
  };
}



const LOCAL_STORAGE_KEY_NODES = 'monitor_bot_nodes_v1';
const LOCAL_STORAGE_KEY_SERVICES = 'monitor_bot_services_v1';
const LOCAL_STORAGE_KEY_INCIDENTS = 'monitor_bot_incidents_v1';
const LOCAL_STORAGE_KEY_TG = 'monitor_bot_tg_v1';
const LOCAL_STORAGE_KEY_API_BASE = 'monitor_bot_api_base_url';


/**
 * Write current in-memory data to localStorage so client-side mutations
 * (import / delete) survive page refreshes and fallback loadData() never
 * re-introduces stale data.
 */
export function syncDataToLocalStorage(
  nodes: MonitorNode[],
  services: WebService[],
  incidents: Incident[],
  tgConfig: TelegramBotConfig,
): void {
  if (typeof window === 'undefined') return;
  try {
    safeLocalStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(nodes));
    safeLocalStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(services));
    safeLocalStorage.setItem(LOCAL_STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    safeLocalStorage.setItem(LOCAL_STORAGE_KEY_TG, JSON.stringify(tgConfig));
  } catch {
    // Storage full or unavailable
  }
}

export const getApiBase = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const custom = safeLocalStorage.getItem(LOCAL_STORAGE_KEY_API_BASE);
    if (custom && custom.trim()) return custom.trim().replace(/\/$/, '');
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim().replace(/\/$/, '');
  } catch {
    // fallback
  }
  return '';
};

export const setApiBase = (url: string): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!url || !url.trim()) {
      safeLocalStorage.removeItem(LOCAL_STORAGE_KEY_API_BASE);
    } else {
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY_API_BASE, url.trim().replace(/\/$/, ''));
    }
  } catch {
    // ignore
  }
};

export const api = {
  // Fetch overall system status & data
  async getStatus(): Promise<{
    overview: SystemOverview;
    nodes: MonitorNode[];
    services: WebService[];
    incidents: Incident[];
  }> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/status`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const overviewData = data.overview || data;
        const rawNodes = Array.isArray(data.nodes) && data.nodes.length > 0 ? data.nodes : initialNodes;
        const rawServices = Array.isArray(data.services) && data.services.length > 0 ? data.services : initialServices;
        const rawIncidents = Array.isArray(data.incidents) ? data.incidents : initialIncidents;

        // Cache fresh server data to localStorage for offline / CDN resilience
        try {
          safeLocalStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(rawNodes));
          safeLocalStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(rawServices));
          safeLocalStorage.setItem(LOCAL_STORAGE_KEY_INCIDENTS, JSON.stringify(rawIncidents));
        } catch {
          // ignore quota limits
        }

        return {
          overview: {
            overallStatus: overviewData.overallStatus || 'operational',
            totalNodes: typeof overviewData.totalNodes === 'number' ? overviewData.totalNodes : rawNodes.length,
            onlineNodes: typeof overviewData.onlineNodes === 'number' ? overviewData.onlineNodes : rawNodes.filter((n: any) => n.status === 'online').length,
            totalServices: typeof overviewData.totalServices === 'number' ? overviewData.totalServices : rawServices.length,
            operationalServices: typeof overviewData.operationalServices === 'number' ? overviewData.operationalServices : rawServices.filter((s: any) => s.status === 'operational').length,
            avgLatencyMs: typeof overviewData.avgLatencyMs === 'number' ? overviewData.avgLatencyMs : 38,
            overallUptimePercent: typeof overviewData.overallUptimePercent === 'number' ? overviewData.overallUptimePercent : 99.98,
            lastUpdated: overviewData.lastUpdated || new Date().toISOString(),
            telegramSync: {
              connected: !!(overviewData.telegramSync?.connected ?? true),
              lastSyncTime: overviewData.telegramSync?.lastSyncTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
              botUsername: overviewData.telegramSync?.botUsername || '@TRpAI_MonitorBot',
            },
          },
          nodes: rawNodes.map(normalizeNode),
          services: rawServices,
          incidents: rawIncidents,
        };
      }
    } catch (err) {
      console.warn('[MonitorBot API] Backend /api/status fetch failed, falling back to local cached storage:', err);
    }

    // Client-side fallback if backend is unavailable (e.g. static Cloudflare Pages preview)
    let nodes: MonitorNode[] = initialNodes;
    let services: WebService[] = initialServices;
    let incidents: Incident[] = initialIncidents;
    let tgConfig: TelegramBotConfig = initialTelegramConfig;

    try {
      const savedNodes = safeLocalStorage.getItem(LOCAL_STORAGE_KEY_NODES);
      const savedServices = safeLocalStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);
      const savedIncidents = safeLocalStorage.getItem(LOCAL_STORAGE_KEY_INCIDENTS);
      const savedTg = safeLocalStorage.getItem(LOCAL_STORAGE_KEY_TG);

      if (savedNodes) nodes = JSON.parse(savedNodes);
      if (savedServices) services = JSON.parse(savedServices);
      if (savedIncidents) incidents = JSON.parse(savedIncidents);
      if (savedTg) tgConfig = JSON.parse(savedTg);
    } catch (e) {
      console.warn('Failed to parse local cached state, using initial seed data:', e);
    }

    const totalNodes = nodes.length;
    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const totalServices = services.length;
    const operationalServices = services.filter(s => s.status === 'operational').length;
    const totalLat = nodes.reduce((sum, n) => sum + (n.metrics.ping.latencyMs || 0), 0);
    const avgLatencyMs = totalNodes > 0 ? Math.round(totalLat / totalNodes) : 0;

    return {
      overview: {
        overallStatus: 'operational',
        totalNodes,
        onlineNodes,
        totalServices,
        operationalServices,
        avgLatencyMs,
        overallUptimePercent: 99.98,
        lastUpdated: new Date().toISOString(),
        telegramSync: {
          connected: tgConfig.connected,
          lastSyncTime: tgConfig.lastSyncTime,
          botUsername: tgConfig.botUsername || '@TRpAI_MonitorBot',
        },
      },
      nodes,
      services,
      incidents,
    };
  },

  // Trigger sync from Telegram Bot
  async syncTelegram(): Promise<{ success: boolean; message: string; syncTime?: string }> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/telegram/sync`, { method: 'POST' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return {
      success: true,
      message: '已模拟从 Telegram Bot 同步最新探针数据！',
      syncTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  },

  // Test Telegram Bot connection
  async testTelegramBot(botToken: string): Promise<{ success: boolean; message: string; botUsername?: string }> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/telegram/test-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return {
      success: true,
      message: '连接验证成功: @TRpAI_MonitorBot (本地模拟)',
      botUsername: '@TRpAI_MonitorBot',
    };
  },

  // Send test alert to Telegram
  async sendTestAlert(botToken?: string, chatId?: string): Promise<{ success: boolean; message: string; preview?: string }> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/telegram/test-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return {
      success: true,
      message: '已模拟发送告警消息至 Telegram 频道/群组！',
      preview: '🔔 [MonitorBot 监控告警测试] 所有节点状态正常。',
    };
  },

  // Trigger single service check
  async checkService(serviceId: string): Promise<WebService | null> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/services/${serviceId}/check`, { method: 'POST' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return null;
  },

  // Node CRUD
  async saveNode(node: MonitorNode, isEdit = false): Promise<MonitorNode> {
    let savedNode = node;
    try {
      const base = getApiBase();
      const url = isEdit ? `${base}/api/nodes/${node.id}` : `${base}/api/nodes`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        savedNode = await res.json();
      }
    } catch (e) {
      console.warn('[MonitorBot API] saveNode backend request failed, using local persistence:', e);
    }

    // Always mirror to localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_NODES);
      let list: MonitorNode[] = stored ? JSON.parse(stored) : initialNodes;
      const idx = list.findIndex(n => n.id === savedNode.id);
      if (idx !== -1) {
        list[idx] = savedNode;
      } else {
        list.push(savedNode);
      }
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to mirror node to localStorage:', e);
    }

    return savedNode;
  },

  async deleteNode(nodeId: string): Promise<boolean> {
    try {
      const base = getApiBase();
      await fetch(`${base}/api/nodes/${nodeId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('[MonitorBot API] deleteNode backend request failed:', e);
    }

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_NODES);
      if (stored) {
        const list: MonitorNode[] = JSON.parse(stored);
        safeLocalStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(list.filter(n => n.id !== nodeId)));
      }
    } catch (e) {
      console.warn('Failed to delete node from localStorage:', e);
    }

    return true;
  },

  // Service CRUD
  async saveService(service: WebService, isEdit = false): Promise<WebService> {
    let savedService = service;
    try {
      const base = getApiBase();
      const url = isEdit ? `${base}/api/services/${service.id}` : `${base}/api/services`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        savedService = await res.json();
      }
    } catch (e) {
      console.warn('[MonitorBot API] saveService backend request failed, using local persistence:', e);
    }

    // Mirror to localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);
      let list: WebService[] = stored ? JSON.parse(stored) : initialServices;
      const idx = list.findIndex(s => s.id === savedService.id);
      if (idx !== -1) {
        list[idx] = savedService;
      } else {
        list.push(savedService);
      }
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to mirror service to localStorage:', e);
    }

    return savedService;
  },

  async deleteService(serviceId: string): Promise<boolean> {
    try {
      const base = getApiBase();
      await fetch(`${base}/api/services/${serviceId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('[MonitorBot API] deleteService backend request failed:', e);
    }

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);
      if (stored) {
        const list: WebService[] = JSON.parse(stored);
        safeLocalStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(list.filter(s => s.id !== serviceId)));
      }
    } catch (e) {
      console.warn('Failed to delete service from localStorage:', e);
    }

    return true;
  },

  // Incident CRUD
  async saveIncident(incident: Incident, isEdit = false): Promise<Incident> {
    let savedIncident = incident;
    try {
      const base = getApiBase();
      const url = isEdit ? `${base}/api/incidents/${incident.id}` : `${base}/api/incidents`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        savedIncident = await res.json();
      }
    } catch (e) {
      console.warn('[MonitorBot API] saveIncident backend request failed, using local persistence:', e);
    }

    // Mirror to localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_INCIDENTS);
      let list: Incident[] = stored ? JSON.parse(stored) : initialIncidents;
      const idx = list.findIndex(i => i.id === savedIncident.id);
      if (idx !== -1) {
        list[idx] = savedIncident;
      } else {
        list = [savedIncident, ...list];
      }
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY_INCIDENTS, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to mirror incident to localStorage:', e);
    }

    return savedIncident;
  },

  async deleteIncident(incidentId: string): Promise<boolean> {
    try {
      const base = getApiBase();
      await fetch(`${base}/api/incidents/${incidentId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('[MonitorBot API] deleteIncident backend request failed:', e);
    }

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_INCIDENTS);
      if (stored) {
        const list: Incident[] = JSON.parse(stored);
        safeLocalStorage.setItem(LOCAL_STORAGE_KEY_INCIDENTS, JSON.stringify(list.filter(i => i.id !== incidentId)));
      }
    } catch (e) {
      console.warn('Failed to delete incident from localStorage:', e);
    }

    return true;
  },

  // Telegram Config
  async getTelegramConfig(): Promise<TelegramBotConfig> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/telegram/config`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        try {
          safeLocalStorage.setItem(LOCAL_STORAGE_KEY_TG, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (e) {
      console.warn('[MonitorBot API] getTelegramConfig backend request failed:', e);
    }
    const saved = safeLocalStorage.getItem(LOCAL_STORAGE_KEY_TG);
    return saved ? JSON.parse(saved) : initialTelegramConfig;
  },

  async saveTelegramConfig(config: Partial<TelegramBotConfig>): Promise<TelegramBotConfig> {
    let finalConfig: TelegramBotConfig = { ...initialTelegramConfig, ...config };
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/telegram/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        finalConfig = data.config;
      }
    } catch (e) {
      console.warn('[MonitorBot API] saveTelegramConfig backend request failed:', e);
    }

    try {
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY_TG, JSON.stringify(finalConfig));
    } catch (e) {
      console.warn('Failed to save telegram config to localStorage:', e);
    }

    return finalConfig;
  },

  // Import full JSON configuration data (syncs to server and updates local cache)
  async importData(data: {
    nodes?: MonitorNode[];
    services?: WebService[];
    incidents?: Incident[];
    telegramConfig?: any;
  }): Promise<{ success: boolean; message: string }> {
    let syncedToServer = false;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        syncedToServer = true;
      }
    } catch (e) {
      console.warn('[MonitorBot API] importData backend request failed, falling back to local storage:', e);
    }

    try {
      if (Array.isArray(data.nodes)) {
        safeLocalStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(data.nodes));
      }
      if (Array.isArray(data.services)) {
        safeLocalStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(data.services));
      }
      if (Array.isArray(data.incidents)) {
        safeLocalStorage.setItem(LOCAL_STORAGE_KEY_INCIDENTS, JSON.stringify(data.incidents));
      }
      if (data.telegramConfig) {
        localStorage.setItem(LOCAL_STORAGE_KEY_TG, JSON.stringify(data.telegramConfig));
      }
    } catch (e) {
      console.warn('Failed to persist imported data to localStorage:', e);
    }

    return {
      success: true,
      message: syncedToServer
        ? '配置数据已成功同步至服务端与本地存储，并即时生效！'
        : '配置数据已成功导入本地持久化存储，并即时刷新生效！',
    };
  },

  // Agent Report Push (for testing agent report from UI)
  async pushNodeReport(nodeId: string, payload: { cpu: number; ram: number; latency: number; temperature?: number }): Promise<boolean> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/nodes/${nodeId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
