import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LayoutDashboard, Cpu, CalendarClock, BellRing, Users, LogOut, Shield } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Machines from './pages/Machines'
import MachineDetail from './pages/MachineDetail'
import Tasks from './pages/Tasks'
import Alerts from './pages/Alerts'
import Login from './pages/Login'
import UsersPage from './pages/Users'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

const navItems = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/machines', label: 'Machines',  icon: Cpu },
  { to: '/tasks',    label: 'Tasks',     icon: CalendarClock },
  { to: '/alerts',   label: 'Alerts',    icon: BellRing },
]

function Sidebar() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-10">
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Cpu size={16} className="text-gray-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">MaintainX</p>
            <p className="text-xs text-gray-500">Scheduler System v1.1</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        {/* Admin only — Users page */}
        {user?.role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            <Users size={18} />
            Users
          </NavLink>
        )}
      </nav>

      {/* Current user info + logout */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center">
              {user?.role === 'admin'
                ? <Shield size={12} className="text-cyan-400" />
                : <Cpu size={12} className="text-gray-400" />
              }
            </div>
            <div>
              <p className="text-xs font-medium text-gray-300">{user?.username}</p>
              <p className="text-xs text-gray-600">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes — require login */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-950 text-gray-100 flex">
                <Sidebar />
                <main className="flex-1 ml-64 min-h-screen">
                  <Routes>
                    <Route path="/"             element={<Dashboard />} />
                    <Route path="/machines"     element={<Machines />} />
                    <Route path="/machines/:id" element={<MachineDetail />} />
                    <Route path="/tasks"        element={<Tasks />} />
                    <Route path="/alerts"       element={<Alerts />} />
                    <Route path="/users"        element={
                      <ProtectedRoute adminOnly>
                        <UsersPage />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}