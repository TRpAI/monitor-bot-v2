import { useState, useEffect } from 'react'
import { Page } from './types'
import Header from './components/Header'
import StatusBanner from './components/StatusBanner'
import NodeList from './components/NodeList'
import ServiceList from './components/ServiceList'
import IncidentSection from './components/IncidentSection'
import AdminDashboard from './components/admin/AdminDashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === 'true') {
      setIsAdmin(true)
      setCurrentPage('admin')
    }
  }, [])

  const handleLogout = () => {
    setIsAdmin(false)
    setCurrentPage('dashboard')
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header
        currentPage={currentPage}
        onSwitchPage={setCurrentPage}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-6">
        {currentPage === 'admin' && isAdmin ? (
          <AdminDashboard onBack={() => setCurrentPage('dashboard')} />
        ) : (
          <>
            <StatusBanner />
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NodeList />
              </div>
              <div>
                <ServiceList />
              </div>
            </div>
            <div className="mt-8">
              <IncidentSection />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
