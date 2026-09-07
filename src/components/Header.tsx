import { useState } from 'react'
import { downloadProjectZip } from '../api'

export default function Header({
  currentPage,
  onSwitchPage,
  isAdmin,
  onLogout
}: {
  currentPage: string
  onSwitchPage: (page: string) => void
  isAdmin: boolean
  onLogout: () => void
}) {
  const [autoRefresh, setAutoRefresh] = useState(30)
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const handleDownload = async () => {
    const blob = await downloadProjectZip()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'monitor-bot-project.zip'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-blue-400">🤖 MonitorBot V2</h1>
            <nav className="flex space-x-2">
              <button
                onClick={() => onSwitchPage('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                监控大屏
              </button>
              <button
                onClick={() => onSwitchPage('admin')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                管理后台
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">自动刷新:</span>
              <select
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(Number(e.target.value))}
                className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={300}>5min</option>
              </select>
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              📦 下载项目
            </button>

            {isAdmin && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                退出
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
