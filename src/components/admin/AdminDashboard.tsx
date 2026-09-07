import { useState } from 'react'
import { testTelegramBot, syncTelegramNodes } from '../api'

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [testResult, setTestResult] = useState<string>('')
  const [syncResult, setSyncResult] = useState<string>('')

  const handleTestBot = async () => {
    try {
      const res = await testTelegramBot({ botToken, chatId, alertThreshold: 2, enabled: true })
      setTestResult(res.success ? '✅ Bot 测试成功！' : `❌ ${res.message}`)
    } catch (e) {
      setTestResult('❌ 请求失败')
    }
  }

  const handleSync = async () => {
    try {
      const res = await syncTelegramNodes()
      setSyncResult(res.success ? `✅ 同步成功！新增 ${res.count} 个节点` : `❌ ${res.message}`)
    } catch (e) {
      setSyncResult('❌ 同步失败')
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">⚙️ 管理后台</h2>
        <button onClick={onBack} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm">
          ← 返回
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700 p-6 rounded-lg">
          <h3 className="font-bold mb-4">🤖 Telegram Bot 配置</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bot Token</label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456:ABC-DEF..."
                className="w-full bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Chat ID</label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001234567890"
                className="w-full bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
              />
            </div>
            <button
              onClick={handleTestBot}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              测试连接
            </button>
            {testResult && <p className="text-sm">{testResult}</p>}
          </div>
        </div>

        <div className="bg-gray-700 p-6 rounded-lg">
          <h3 className="font-bold mb-4">📡 数据同步</h3>
          <p className="text-gray-400 text-sm mb-4">
            从 Telegram Bot 同步最新节点心跳数据
          </p>
          <button
            onClick={handleSync}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
          >
            同步数据
          </button>
          {syncResult && <p className="text-sm mt-2">{syncResult}</p>}
        </div>

        <div className="bg-gray-700 p-6 rounded-lg md:col-span-2">
          <h3 className="font-bold mb-4">🚀 部署指南</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-600 p-4 rounded-lg">
              <h4 className="font-bold text-blue-400">Docker</h4>
              <pre className="text-xs text-gray-300 mt-2 overflow-x-auto">
{`docker compose up -d --build`}
              </pre>
            </div>
            <div className="bg-gray-600 p-4 rounded-lg">
              <h4 className="font-bold text-purple-400">Cloudflare</h4>
              <pre className="text-xs text-gray-300 mt-2 overflow-x-auto">
{`npm run build
# 连接 GitHub -> Cloudflare Pages`}
              </pre>
            </div>
            <div className="bg-gray-600 p-4 rounded-lg">
              <h4 className="font-bold text-green-400">VPS</h4>
              <pre className="text-xs text-gray-300 mt-2 overflow-x-auto">
{`chmod +x deploy.sh
./deploy.sh`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
