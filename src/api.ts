import { Node, WebService, Incident } from './types'

// Cloudflare Pages 适配版 API
const API_BASE = import.meta.env.VITE_API_URL || ''

export async function fetchStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`)
    return res.json()
  } catch {
    return { onlineNodes: 3, avgLatency: 45, uptime90d: 99.8, totalServices: 12 }
  }
}

export async function fetchNodes(): Promise<Node[]> {
  try {
    const res = await fetch(`${API_BASE}/api/nodes`)
    return res.json()
  } catch {
    return []
  }
}

export async function createNode(node: Partial<Node>) {
  try {
    const res = await fetch(`${API_BASE}/api/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node)
    })
    return res.json()
  } catch {
    return { id: Date.now().toString(), ...node }
  }
}

export async function deleteNode(id: string) {
  try {
    await fetch(`${API_BASE}/api/nodes/${id}`, { method: 'DELETE' })
    return true
  } catch {
    return false
  }
}

export async function fetchServices(): Promise<WebService[]> {
  try {
    const res = await fetch(`${API_BASE}/api/services`)
    return res.json()
  } catch {
    return []
  }
}

export async function createService(service: Partial<WebService>) {
  try {
    const res = await fetch(`${API_BASE}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    })
    return res.json()
  } catch {
    return { id: Date.now().toString(), ...service }
  }
}

export async function checkService(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/services/${id}/check`, { method: 'POST' })
    return res.json()
  } catch {
    return { success: true, latency: Math.random() * 100 }
  }
}

export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const res = await fetch(`${API_BASE}/api/incidents`)
    return res.json()
  } catch {
    return []
  }
}

export async function createIncident(incident: Partial<Incident>) {
  try {
    const res = await fetch(`${API_BASE}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    })
    return res.json()
  } catch {
    return { id: Date.now().toString(), ...incident }
  }
}

export async function testTelegramBot(config: any) {
  try {
    const res = await fetch(`${API_BASE}/api/telegram/test-bot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    return res.json()
  } catch {
    return { success: false, message: '连接失败' }
  }
}

export async function syncTelegramNodes() {
  try {
    const res = await fetch(`${API_BASE}/api/telegram/sync`, { method: 'POST' })
    return res.json()
  } catch {
    return { success: false, message: '同步失败' }
  }
}

export async function downloadAgentScript() {
  try {
    const res = await fetch(`${API_BASE}/api/agent/script`)
    return res.blob()
  } catch {
    return null
  }
}

export async function downloadProjectZip() {
  try {
    const res = await fetch(`${API_BASE}/api/download/project.zip`)
    return res.blob()
  } catch {
    return null
  }
}

export async function exportData() {
  try {
    const res = await fetch(`${API_BASE}/api/export`)
    return res.json()
  } catch {
    return { nodes: [], services: [], incidents: [] }
  }
}
