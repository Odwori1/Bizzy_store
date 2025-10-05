import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import SessionWarningModal from './SessionWarningModal' // NEW IMPORT
import { useAuthStore } from '../hooks/useAuth' // NEW IMPORT

export default function Layout() {
  // NEW: Get session state from auth store
  const { 
    sessionWarningActive, 
    sessionSecondsRemaining, 
    extendSession, 
    logout 
  } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
        
        {/* NEW: Session Warning Modal */}
        <SessionWarningModal
          isOpen={sessionWarningActive}
          secondsRemaining={sessionSecondsRemaining}
          onExtendSession={extendSession}
          onLogout={logout}
        />
      </div>
    </div>
  )
}
