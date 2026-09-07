import { useEffect, useState } from 'react'
import { fetchIncidents, createIncident } from '../api'
import { Incident } from '../types'

const STATUS_MAP = {
  active: { label: '进行中', class: 'bg-red-500/20 text-red-400' },
  investigating: { label: '排查中', class: 'bg-yellow-500/20 text-yellow-400' },
  identified: { label: '已定位', class: 'bg-blue-500/20 text-blue-400' },
  monitoring: { label: '观察中', class: 'bg-purple-500/20 text-purple-400' },
  resolved: { label: '已恢复', class: 'bg-green-500/20 text-green-400' },
  scheduled: { label: '计划中', class: 'bg-gray-500/20 text-gray-400' }
}

export default function IncidentSection() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    type: 'incident' as Incident['type'],
    status: 'active' as Incident['status']
  })

  const load = async () => {
    try {
      const result = await fetchIncidents()
      setIncidents(result)
    } catch (e) {
      console.error('Failed to load incidents', e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async () => {
    try {
      await createIncident(newIncident)
      setShowAdd(false)
      setNewIncident({ title: '', description: '', type: 'incident', status: 'active' })
      load()
    } catch (e) {
      console.error('Failed to add incident', e)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📢 事件公告</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
        >
          + 发布事件
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="事件标题"
              value={newIncident.title}
              onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
            />
            <textarea
              placeholder="事件描述"
              value={newIncident.description}
              onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded border border-gray-500 h-24"
            />
            <div className="flex space-x-2">
              <select
                value={newIncident.type}
                onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value as Incident['type'] })}
                className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
              >
                <option value="incident">故障</option>
                <option value="maintenance">维护</option>
                <option value="update">更新</option>
              </select>
              <select
                value={newIncident.status}
                onChange={(e) => setNewIncident({ ...newIncident, status: e.target.value as Incident['status'] })}
                className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
              >
                <option value="active">进行中</option>
                <option value="investigating">排查中</option>
                <option value="identified">已定位</option>
                <option value="monitoring">观察中</option>
                <option value="resolved">已恢复</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm">
                发布
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">暂无事件公告</div>
        ) : (
          incidents.map((inc) => {
            const statusInfo = STATUS_MAP[inc.status]
            return (
              <div key={inc.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(inc.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold mt-2">{inc.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{inc.description}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
