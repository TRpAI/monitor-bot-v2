import { useEffect, useState } from 'react'
import { fetchNodes, createNode, deleteNode } from '../api'
import { Node } from '../types'
import NodeDetailModal from './NodeDetailModal'

export default function NodeList() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newNode, setNewNode] = useState({ name: '', ip: '', region: '未知' })

  const load = async () => {
    try {
      const result = await fetchNodes()
      setNodes(result)
    } catch (e) {
      console.error('Failed to load nodes', e)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAdd = async () => {
    try {
      await createNode(newNode)
      setShowAdd(false)
      setNewNode({ name: '', ip: '', region: '未知' })
      load()
    } catch (e) {
      console.error('Failed to add node', e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此节点？')) return
    await deleteNode(id)
    load()
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">🖥️ 服务器节点</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
        >
          + 添加节点
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="节点名称"
              value={newNode.name}
              onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
              className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
            />
            <input
              type="text"
              placeholder="IP 地址"
              value={newNode.ip}
              onChange={(e) => setNewNode({ ...newNode, ip: e.target.value })}
              className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
            />
            <select
              value={newNode.region}
              onChange={(e) => setNewNode({ ...newNode, region: e.target.value })}
              className="bg-gray-600 text-white px-4 py-2 rounded border border-gray-500"
            >
              <option>北美</option>
              <option>欧洲</option>
              <option>东南亚</option>
              <option>东亚</option>
              <option>未知</option>
            </select>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              确认添加
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => setSelectedNode(node)}
            className={`p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors border ${
              node.status === 'online' ? 'border-green-500' :
              node.status === 'warning' ? 'border-yellow-500' : 'border-red-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{node.name}</h3>
                <p className="text-sm text-gray-400">{node.ip}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                node.status === 'online' ? 'bg-green-500/20 text-green-400' :
                node.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {node.status === 'online' ? '在线' : node.status === 'warning' ? '警告' : '离线'}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span className={node.cpu > 80 ? 'text-red-400' : 'text-gray-300'}>{node.cpu}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${node.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${node.cpu}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>内存</span>
                <span className={node.memory > 80 ? 'text-red-400' : 'text-gray-300'}>{node.memory}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${node.memory > 80 ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${node.memory}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedNode && (
        <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  )
}
