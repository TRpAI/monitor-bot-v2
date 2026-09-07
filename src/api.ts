import { MonitorNode, WebService, Incident, TelegramBotConfig, SystemOverview } from './types';
import { initialNodes, initialServices, initialIncidents, initialTelegramConfig } from './mockData';

const LOCAL_STORAGE_KEY_NODES = 'monitor_bot_nodes_v1';
const LOCAL_STORAGE_KEY_SERVICES = 'monitor_bot_services_v1';
const LOCAL_STORAGE_KEY_INCIDENTS = 'monitor_bot_incidents_v1';
const LOCAL_STORAGE_KEY_TG = 'monitor_bot_tg_v1';
const LOCAL_STORAGE_KEY_API_BASE = 'monitor_bot_api_base_url';

// Export keys so App can persist client-side mutations to localStorage
export const STORAGE_KEYS = {
  nodes: LOCAL_STORAGE_KEY_NODES,
  services: LOCAL_STORAGE_KEY_SERVICES,
  incidents: LOCAL_STORAGE_KEY_INCIDENTS,
  tg: LOCAL_STORAGE_KEY_TG,
};

/**
 * Write current in-memory data to localStorage so that
 * client-side mutations (import / delete) survive page refreshes
 * and the fallback loadData() never re-introduces stale data.
 */
export function syncDataToLocalStorage(
  nodes: MonitorNode[],
  services: WebService[],
  incidents: Incident[],
  tgConfig: TelegramBotConfig,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.nodes, JSON.stringify(nodes));
    window.localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(services));
    window.localStorage.setItem(STORAGE_KEYS.incidents, JSON.stringify(incidents));
    window.localStorage.setItem(STORAGE_KEYS.tg, JSON.stringify(tgConfig));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export const getApiBase = (): string => {
  if (typeof window === 'undefined') return '';
  const custom = localStorage.getItem(LOCAL_STORAGE_KEY_API_BASE);
  if (custom && custom.trim()) return custom.trim().replace(/\/$/, '');
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim().replace(/\/$/, '');
  return '';
};

export const setApiBase = (url: string): void => {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem(LOCAL_STORAGE_KEY_API_BASE);
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEY_API_BASE, url.trim().replace(/\/$/, ''));
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
        return {
          overview: {
            overallStatus: data.overallStatus,
            totalNodes: data.totalNodes,
            onlineNodes: data.onlineNodes,
            totalServices: data.totalServices,
            operationalServices: data.operationalServices,
            avgLatencyMs: data.avgLatencyMs,
            overallUptimePercent: data.overallUptimePercent,
            lastUpdated: data.lastUpdated,
            telegramSync: data.telegramSync,
          },
          nodes: data.nodes,
          services: data.services,
          incidents: data.incidents,
        };
      }
    } catch {
      // Fallback to local storage or mock
    }

    // Client-side fallback if backend is unavailable (e.g. static Cloudflare Pages preview)
    const savedNodes = localStorage.getItem(LOCAL_STORAGE_KEY_NODES);
    const savedServices = localStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);
    const savedIncidents = localStorage.getItem(LOCAL_STORAGE_KEY_INCIDENTS);
    const savedTg = localStorage.getItem(LOCAL_STORAGE_KEY_TG);

    const nodes: MonitorNode[] = savedNodes ? JSON.parse(savedNodes) : initialNodes;
    const services: WebService[] = savedServices ? JSON.parse(savedServices) : initialServices;
    const incidents: Incident[] = savedIncidents ? JSON.parse(savedIncidents) : initialIncidents;
    const tgConfig: TelegramBotConfig = savedTg ? JSON.parse(savedTg) : initialTelegramConfig;

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
      if (res.ok && contentType.includes('application/json')) return await res.json();
    } catch {
      // ignore
    }
    return node;
  },

  async deleteNode(nodeId: string): Promise<boolean> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/nodes/${nodeId}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    return true;
  },

  // Service CRUD
  async saveService(service: WebService, isEdit = false): Promise<WebService> {
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
      if (res.ok && contentType.includes('application/json')) return await res.json();
    } catch {
      // ignore
    }
    return service;
  },

  async deleteService(serviceId: string): Promise<boolean> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/services/${serviceId}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    return true;
  },

  // Incident CRUD
  async saveIncident(incident: Incident, isEdit = false): Promise<Incident> {
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
      if (res.ok && contentType.includes('application/json')) return await res.json();
    } catch {
      // ignore
    }
    return incident;
  },

  async deleteIncident(incidentId: string): Promise<boolean> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/incidents/${incidentId}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    return true;
  },

  // Telegram Config
  async getTelegramConfig(): Promise<TelegramBotConfig> {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/telegram/config`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) return await res.json();
    } catch {
      // ignore
    }
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TG);
    return saved ? JSON.parse(saved) : initialTelegramConfig;
  },

  async saveTelegramConfig(config: Partial<TelegramBotConfig>): Promise<TelegramBotConfig> {
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
        return data.config;
      }
    } catch {
      // ignore
    }
    return { ...initialTelegramConfig, ...config };
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
