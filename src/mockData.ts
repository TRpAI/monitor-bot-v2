import { Node, WebService, Incident } from './types'

// Cloudflare Pages 纯静态版本 - 使用模拟数据
// 生产环境可替换为真实 API 调用

export const mockNodes: Node[] = [
  {
    id: '1',
    name: 'US-East-1',
    ip: '192.168.1.100',
    region: '北美',
    cpu: 45.2,
    memory: 62.8,
    disk: 35.5,
    netUp: 12.5,
    netDown: 45.8,
    temperature: 65,
    status: 'online',
    lastReport: new Date().toISOString(),
    specs: { cpuModel: 'Intel Xeon E5', memoryTotal: '32GB', diskTotal: '1TB SSD', os: 'Ubuntu 22.04' }
  },
  {
    id: '2',
    name: 'EU-West-1',
    ip: '10.0.0.50',
    region: '欧洲',
    cpu: 23.1,
    memory: 45.6,
    disk: 28.9,
    netUp: 8.2,
    netDown: 32.1,
    temperature: 58,
    status: 'online',
    lastReport: new Date().toISOString(),
    specs: { cpuModel: 'AMD EPYC', memoryTotal: '64GB', diskTotal: '2TB SSD', os: 'Debian 12' }
  },
  {
    id: '3',
    name: 'AP-Southeast-1',
    ip: '172.16.0.25',
    region: '东南亚',
    cpu: 78.5,
    memory: 85.2,
    disk: 45.3,
    netUp: 25.6,
    netDown: 68.9,
    temperature: 72,
    status: 'warning',
    lastReport: new Date().toISOString(),
    specs: { cpuModel: 'Intel i7', memoryTotal: '32GB', diskTotal: '512GB NVMe', os: 'Ubuntu 24.04' }
  }
]

export const mockServices: WebService[] = [
  { id: '1', name: '生产 API', url: 'https://api.example.com', type: 'https', status: 'up', latency: 45, uptime90d: 99.95, lastCheck: new Date().toISOString() },
  { id: '2', name: '用户服务', url: 'https://users.example.com', type: 'https', status: 'up', latency: 32, uptime90d: 99.89, lastCheck: new Date().toISOString() },
  { id: '3', name: '支付网关', url: 'https://pay.example.com', type: 'https', status: 'degraded', latency: 280, uptime90d: 98.5, lastCheck: new Date().toISOString() }
]

export const mockIncidents: Incident[] = [
  { id: '1', type: 'incident', title: '支付网关延迟升高', description: '东南亚区域支付接口响应时间异常', status: 'investigating', created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date().toISOString() }
]

// API 客户端（适配 Cloudflare Pages）
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchStatus() {
  return { onlineNodes: 3, avgLatency: 45, uptime90d: 99.8, totalServices: 12 }
}

export async function fetchNodes() {
  return mockNodes
}

export async function fetchServices() {
  return mockServices
}

export async function fetchIncidents() {
  return mockIncidents
}
