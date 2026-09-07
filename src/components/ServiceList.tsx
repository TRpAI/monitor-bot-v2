import { useEffect, useState } from 'react'
import { fetchServices, createService, checkService } from '../api'
import { WebService } from '../types'

export default function ServiceList() {
  const [services, setServices] = useState<WebService[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newService, setNewService] = useState({ name: '', url: '', type: 'https' as 'http' | 'https' | 'tcp' })

  const load = async () => {
    try {
      const result = await fetchServices()
      setServices(result)
    } catch (e) {
      console.error('Failed to load services', e)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleAdd = async () => {
    try {
      await createService(newService)
      setShowAdd(false)
      setNewService({ name: '', url: '', type: 'https' })
      load()
    } catch (e) {
      console.error('Failed to add service', e)
    }
  }

  const handleCheck = async (id: string) => {
    await checkService(id)
    load()
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">🌐 服务监控</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
        >
          + 添加服务
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="服务名称"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
            />
            <input
              type="text"
              placeholder="URL (https://...)"
              value={newService.url}
              onChange={(e) => setNewService({ ...newService, url: e.target.value })}
              className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
            />
            <select
              value={newService.type}
              onChange={(e) => setNewService({ ...newService, type: e.target.value as any })}
              className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
            >
              <option value="https">HTTPS</option>
              <option value="http">HTTP</option>
              <option value="tcp">TCP</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm">
              确认添加
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm">
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  svc.status === 'up' ? 'bg-green-500' :
                  svc.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></span>
                <h3 className="font-medium">{svc.name}</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">{svc.url}</p>
              <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                <span>延迟: {svc.latency}ms</span>
                <span>可用率: {svc.uptime90d}%</span>
              </div>
            </div>
            <button
              onClick={() => handleCheck(svc.id)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
            >
              立即检测
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
