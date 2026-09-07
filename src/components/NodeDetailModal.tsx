import { Node } from '../types'

interface NodeDetailModalProps {
  node: Node
  onClose: () => void
}

export default function NodeDetailModal({ node, onClose }: NodeDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{node.name}</h2>
              <p className="text-gray-400">{node.ip} · {node.region}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm mb-2">系统规格</h3>
              <p className="text-sm"><span className="text-gray-500">CPU:</span> {node.specs.cpuModel}</p>
              <p className="text-sm"><span className="text-gray-500">内存:</span> {node.specs.memoryTotal}</p>
              <p className="text-sm"><span className="text-gray-500">磁盘:</span> {node.specs.diskTotal}</p>
              <p className="text-sm"><span className="text-gray-500">系统:</span> {node.specs.os}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm mb-2">网络流量</h3>
              <p className="text-sm"><span className="text-gray-500">上传:</span> {node.netUp} Mbps</p>
              <p className="text-sm"><span className="text-gray-500">下载:</span> {node.netDown} Mbps</p>
              <p className="text-sm"><span className="text-gray-500">最后报告:</span> {new Date(node.lastReport).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold">实时指标</h3>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU 使用率</span>
                <span className={node.cpu > 80 ? 'text-red-400' : 'text-gray-300'}>{node.cpu}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${node.cpu > 80 ? 'bg-red-500' : node.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${node.cpu}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>内存使用率</span>
                <span className={node.memory > 80 ? 'text-red-400' : 'text-gray-300'}>{node.memory}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${node.memory > 80 ? 'bg-red-500' : node.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${node.memory}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>磁盘使用率</span>
                <span className={node.disk > 80 ? 'text-red-400' : 'text-gray-300'}>{node.disk}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${node.disk > 80 ? 'bg-red-500' : node.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${node.disk}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>温度</span>
                <span className={node.temperature > 75 ? 'text-red-400' : 'text-gray-300'}>{node.temperature}°C</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${node.temperature > 75 ? 'bg-red-500' : node.temperature > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(node.temperature, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
