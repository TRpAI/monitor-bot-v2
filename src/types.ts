export interface Node {
  id: string
  name: string
  ip: string
  region: string
  cpu: number
  memory: number
  disk: number
  netUp: number
  netDown: number
  temperature: number
  status: 'online' | 'offline' | 'warning'
  lastReport: string
  specs: {
    cpuModel: string
    memoryTotal: string
    diskTotal: string
    os: string
  }
}

export interface WebService {
  id: string
  name: string
  url: string
  type: 'http' | 'https' | 'tcp'
  port?: number
  status: 'up' | 'down' | 'degraded'
  latency: number
  uptime90d: number
  lastCheck: string
}

export interface Incident {
  id: string
  type: 'outage' | 'maintenance' | 'incident' | 'update'
  title: string
  description: string
  status: 'active' | 'investigating' | 'identified' | 'monitoring' | 'resolved'
  created_at: string
  updated_at: string
  affected_services?: string[]
}

export interface TelegramConfig {
  botToken: string
  chatId: string
  alertThreshold: number
  enabled: boolean
}

export type Page = 'dashboard' | 'admin'
