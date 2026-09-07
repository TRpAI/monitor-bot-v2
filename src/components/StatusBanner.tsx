import { useEffect, useState } from 'react'
import { fetchStatus } from '../api'

export default function StatusBanner() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchStatus()
        setData(result)
      } catch (e) {
        console.error('Failed to load status', e)
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return <div className="animate-pulse bg-gray-800 h-24 rounded-lg"></div>

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400">{data.onlineNodes ?? '-'}</div>
          <div className="text-gray-400 text-sm mt-1">在线节点</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400">{data.avgLatency ?? '-'}ms</div>
          <div className="text-gray-400 text-sm mt-1">平均延迟</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400">{data.uptime90d ?? '-'}%</div>
          <div className="text-gray-400 text-sm mt-1">90天可用率</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400">{data.totalServices ?? '-'}</div>
          <div className="text-gray-400 text-sm mt-1">监控服务</div>
        </div>
      </div>
    </div>
  )
}
