import { Node, WebService, Incident } from './types'

export const mockNodes: Node[] = [
  {
    id: 'node-1',
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
    specs: {
      cpuModel: 'Intel Xeon E5-2680',
      memoryTotal: '32GB',
      diskTotal: '1TB SSD',
      os: 'Ubuntu 22.04'
    }
  },
  {
    id: 'node-2',
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
    specs: {
      cpuModel: 'AMD EPYC 7401',
      memoryTotal: '64GB',
      diskTotal: '2TB SSD',
      os: 'Debian 12'
    }
  },
  {
    id: 'node-3',
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
    specs: {
      cpuModel: 'Intel Core i7-12700',
      memoryTotal: '32GB',
      diskTotal: '512GB NVMe',
      os: 'Ubuntu 24.04'
    }
  }
]

export const mockServices: WebService[] = [
  {
    id: 'svc-1',
    name: '生产 API',
    url: 'https://api.example.com',
    type: 'https',
    status: 'up',
    latency: 45,
    uptime90d: 99.95,
    lastCheck: new Date().toISOString()
  },
  {
    id: 'svc-2',
    name: '用户服务',
    url: 'https://users.example.com',
    type: 'https',
    status: 'up',
    latency: 32,
    uptime90d: 99.89,
    lastCheck: new Date().toISOString()
  },
  {
    id: 'svc-3',
    name: '支付网关',
    url: 'https://pay.example.com',
    type: 'https',
    status: 'degraded',
    latency: 280,
    uptime90d: 98.5,
    lastCheck: new Date().toISOString()
  }
]

export const mockIncidents: Incident[] = [
  {
    id: 'inc-1',
    type: 'incident',
    title: '支付网关延迟升高',
    description: '东南亚区域支付接口响应时间异常，正在排查中',
    status: 'investigating',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    affected_services: ['支付网关']
  },
  {
    id: 'inc-2',
    type: 'maintenance',
    title: '计划内维护',
    description: '每周例行系统维护，预计影响 2 小时',
    status: 'scheduled',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
]
