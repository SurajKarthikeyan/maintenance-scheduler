import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LayoutDashboard, Cpu, CalendarClock, BellRing } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Machines from './pages/Machines'
import MachineDetail from './pages/MachineDetail'
import Tasks from './pages/Tasks'
import Alerts from './pages/Alerts'
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950 text-gray-100 flex">

          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-10">
            <div className="px-6 py-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
                  <Cpu size={16} className="text-gray-950" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-wide">MaintainX</p>
                  <p className="text-xs text-gray-500">Scheduler System</p>
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
            </nav>

            <div className="px-6 py-4 border-t border-gray-800">
              <p className="text-xs text-gray-600">v1.0.0 · NTT Data Case Study</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 ml-64 min-h-screen">
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/machines"     element={<Machines />} />
              <Route path="/machines/:id" element={<MachineDetail />} />
              <Route path="/tasks"        element={<Tasks />} />
              <Route path="/alerts"       element={<Alerts />} />
            </Routes>
          </main>

        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}