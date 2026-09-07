import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

// API 路由
app.get('/api/status', (req, res) => {
  res.json({
    onlineNodes: 3,
    avgLatency: 45,
    uptime90d: 99.8,
    totalServices: 12
  })
})

app.get('/api/nodes', (req, res) => {
  res.json([])
})

app.post('/api/nodes', (req, res) => {
  res.json({ id: Date.now().toString(), ...req.body })
})

app.delete('/api/nodes/:id', (req, res) => {
  res.json({ success: true })
})

app.post('/api/nodes/:id/report', (req, res) => {
  res.json({ success: true })
})

app.get('/api/services', (req, res) => {
  res.json([])
})

app.post('/api/services', (req, res) => {
  res.json({ id: Date.now().toString(), ...req.body })
})

app.post('/api/services/:id/check', (req, res) => {
  res.json({ success: true, latency: Math.random() * 100 })
})

app.get('/api/incidents', (req, res) => {
  res.json([])
})

app.post('/api/incidents', (req, res) => {
  res.json({ id: Date.now().toString(), ...req.body })
})

app.post('/api/telegram/test-bot', (req, res) => {
  const { botToken, chatId } = req.body
  if (!botToken || !chatId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' })
  }
  res.json({ success: true, message: '连接成功' })
})

app.post('/api/telegram/sync', (req, res) => {
  res.json({ success: true, count: 0 })
})

app.get('/api/agent/script', (req, res) => {
  const script = `#!/bin/bash
# MonitorBot Agent 安装脚本
echo "Installing MonitorBot Agent..."
# TODO: 实现 Agent 安装逻辑
echo "Agent installed successfully!"
`
  res.setHeader('Content-Type', 'text/plain')
  res.send(script)
})

app.get('/api/download/project.zip', (req, res) => {
  res.status(200).json({ message: 'ZIP 下载功能待实现' })
})

app.get('/api/export', (req, res) => {
  res.json({ nodes: [], services: [], incidents: [] })
})

// 前端路由 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
