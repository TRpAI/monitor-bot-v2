export type NodeStatus = 'online' | 'degraded' | 'offline' | 'maintenance';
export type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IncidentSeverity = 'critical' | 'major' | 'minor' | 'maintenance';

export interface NodeMetrics {
  cpu: {
    usagePercent: number;
    cores: number;
    model: string;
  };
  memory: {
    usedMb: number;
    totalMb: number;
    percent: number;
  };
  swap?: {
    usedMb: number;
    totalMb: number;
    percent: number;
  };
  disk: {
    usedGb: number;
    totalGb: number;
    percent: number;
  };
  network: {
    upSpeedKb: number;
    downSpeedKb: number;
    totalUpGb: number;
    totalDownGb: number;
  };
  load: [number, number, number];
  ping: {
    latencyMs: number;
    lossPercent: number;
  };
  uptimeSeconds: number;
  temperatureCelsius?: number;
  os: string;
  kernel?: string;
  ip?: string;
  history?: {
    time: string;
    cpu: number;
    ram: number;
    latency: number;
  }[];
}

export interface MonitorNode {
  id: string;
  name: string;
  host: string;
  region: string;
  countryCode: string;
  type: 'vps' | 'dedicated' | 'docker' | 'edge' | 'rpi';
  status: NodeStatus;
  lastSeen: string;
  tags: string[];
  metrics: NodeMetrics;
  tgBotReported?: boolean;
}

export interface ServiceHistoryDay {
  date: string;
  status: 'operational' | 'degraded' | 'outage';
  uptimePercent: number;
}

export interface WebService {
  id: string;
  name: string;
  url: string;
  group: '核心API' | '公共前端' | '鉴权与安全' | '数据库与缓存' | 'Telegram服务';
  method: 'GET' | 'POST' | 'HEAD' | 'TCP';
  intervalSec: number;
  status: ServiceStatus;
  statusCode: number;
  latencyMs: number;
  sslValid: boolean;
  sslExpiryDays: number;
  uptime90d: number;
  history90d: ServiceHistoryDay[];
  lastChecked: string;
  description?: string;
}

export interface IncidentUpdate {
  id: string;
  timestamp: string;
  status: IncidentStatus;
  message: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: string[];
  createdAt: string;
  updatedAt: string;
  updates: IncidentUpdate[];
}

export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
  botUsername?: string;
  connected: boolean;
  autoSync: boolean;
  syncIntervalSec: number;
  lastSyncTime: string | null;
  alertOnNodeOffline: boolean;
  alertOnHighLoad: boolean;
  thresholds: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    tempCelsius: number;
    latencyMs: number;
  };
  webhookUrl?: string;
  lastError?: string | null;
}

export interface SystemOverview {
  overallStatus: 'operational' | 'degraded' | 'outage';
  totalNodes: number;
  onlineNodes: number;
  totalServices: number;
  operationalServices: number;
  avgLatencyMs: number;
  overallUptimePercent: number;
  lastUpdated: string;
  telegramSync: {
    connected: boolean;
    lastSyncTime: string | null;
    botUsername?: string;
  };
}
