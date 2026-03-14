import { useQuery } from '@tanstack/react-query'
import { Cpu, AlertTriangle, CalendarClock, CheckCircle, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { machinesApi } from '../api/machines'
import { tasksApi } from '../api/tasks'
import { alertsApi } from '../api/alerts'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'
import { Link } from 'react-router-dom'

const STATUS_COLORS = {
  Operational: '#10b981',
  'Needs Maintenance': '#f59e0b',
  'Under Maintenance': '#3b82f6',
}

export default function Dashboard() {
  const { data: machinesRes } = useQuery({ queryKey: ['machines'], queryFn: () => machinesApi.getAll() })
  const { data: overdueTasksRes } = useQuery({ queryKey: ['tasks-overdue'], queryFn: () => tasksApi.getOverdue() })
  const { data: alertsRes } = useQuery({ queryKey: ['alerts'], queryFn: () => alertsApi.getAll({ resolved: false }) })
  const { data: upcomingRes } = useQuery({ queryKey: ['tasks-upcoming'], queryFn: () => tasksApi.getUpcoming(30) })

  const machines = machinesRes?.data?.data || []
  const overdueTasks = overdueTasksRes?.data?.data || []
  const alerts = alertsRes?.data?.data || []
  const upcoming = upcomingRes?.data?.data || []

  const operational = machines.filter(m => m.status === 'Operational').length
  const needsMaintenance = machines.filter(m => m.status === 'Needs Maintenance').length
  const underMaintenance = machines.filter(m => m.status === 'Under Maintenance').length

  const chartData = [
    { name: 'Operational', value: operational },
    { name: 'Needs Maint.', value: needsMaintenance },
    { name: 'Under Maint.', value: underMaintenance },
  ]

  return (
    <div className="p-8">
      <PageHeader title="Dashboard" subtitle="Live overview of your plant maintenance status" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/machines"><StatCard label="Total Machines"  value={machines.length}     icon={Cpu}           color="cyan" /></Link>
        <Link to="/alerts"><StatCard label="Active Alerts"   value={alerts.length}       icon={AlertTriangle}  color="red" /></Link>
        <Link to="/tasks"><StatCard label="Overdue Tasks"   value={overdueTasks.length} icon={CalendarClock}  color="amber" /></Link>
        <Link to="/machines?status=Operational"><StatCard label="Operational" value={operational} icon={CheckCircle} color="emerald" /></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Machine Status Overview</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                labelStyle={{ color: '#f9fafb' }}
                itemStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={Object.values(STATUS_COLORS)[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <h2 className="text-sm font-semibold text-white">Active Alerts</h2>
            </div>
            <Link to="/alerts" className="text-xs text-cyan-400 hover:text-cyan-300">View all →</Link>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No active alerts</p>
            ) : alerts.slice(0, 5).map(alert => (
              <div key={alert.alert_id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm text-gray-200">{alert.machine_name}</p>
                  <p className="text-xs text-gray-500">{alert.days_overdue} days overdue</p>
                </div>
                <StatusBadge status={alert.alert_type} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Upcoming Tasks (next 30 days)</h2>
          </div>
          <Link to="/tasks" className="text-xs text-cyan-400 hover:text-cyan-300">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No upcoming tasks in the next 30 days</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-800">
                  <th className="text-left pb-2">Task</th>
                  <th className="text-left pb-2">Machine</th>
                  <th className="text-left pb-2">Scheduled</th>
                  <th className="text-left pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {upcoming.map(task => (
                  <tr key={task.task_id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-2.5 text-gray-200">{task.task_description}</td>
                    <td className="py-2.5 text-gray-400">Machine #{task.machine_id}</td>
                    <td className="py-2.5 text-gray-400">{new Date(task.scheduled_date).toLocaleDateString()}</td>
                    <td className="py-2.5"><StatusBadge status={task.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}