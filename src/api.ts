import { Node, WebService, Incident, TelegramConfig } from './types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`)
  return res.json()
}

export async function fetchNodes() {
  const res = await fetch(`${API_BASE}/nodes`)
  return res.json()
}

export async function createNode(node: Partial<Node>) {
  const res = await fetch(`${API_BASE}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(node)
  })
  return res.json()
}

export async function updateNode(id: string, node: Partial<Node>) {
  const res = await fetch(`${API_BASE}/nodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(node)
  })
  return res.json()
}

export async function deleteNode(id: string) {
  const res = await fetch(`${API_BASE}/nodes/${id}`, {
    method: 'DELETE'
  })
  return res.json()
}

export async function reportNodeMetrics(id: string, metrics: {
  cpu: number
  memory: number
  disk: number
  netUp: number
  netDown: number
  temperature: number
}) {
  const res = await fetch(`${API_BASE}/nodes/${id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics)
  })
  return res.json()
}

export async function fetchServices() {
  const res = await fetch(`${API_BASE}/services`)
  return res.json()
}

export async function createService(service: Partial<WebService>) {
  const res = await fetch(`${API_BASE}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service)
  })
  return res.json()
}

export async function checkService(id: string) {
  const res = await fetch(`${API_BASE}/services/${id}/check`, {
    method: 'POST'
  })
  return res.json()
}

export async function fetchIncidents() {
  const res = await fetch(`${API_BASE}/incidents`)
  return res.json()
}

export async function createIncident(incident: Partial<Incident>) {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incident)
  })
  return res.json()
}

export async function testTelegramBot(config: TelegramConfig) {
  const res = await fetch(`${API_BASE}/telegram/test-bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  return res.json()
}

export async function syncTelegramNodes() {
  const res = await fetch(`${API_BASE}/telegram/sync`, {
    method: 'POST'
  })
  return res.json()
}

export async function downloadAgentScript() {
  const res = await fetch(`${API_BASE}/agent/script`)
  return res.blob()
}

export async function downloadProjectZip() {
  const res = await fetch(`${API_BASE}/download/project.zip`)
  return res.blob()
}

export async function exportData() {
  const res = await fetch(`${API_BASE}/export`)
  return res.json()
}
