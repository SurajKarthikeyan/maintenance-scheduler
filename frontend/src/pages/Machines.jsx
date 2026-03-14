import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Cpu, MapPin, Calendar, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { machinesApi } from '../api/machines'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'

const STATUSES = ['Operational', 'Needs Maintenance', 'Under Maintenance']

function MachineForm({ onSubmit, onClose, loading }) {
  const [form, setForm] = useState({
    name: '', location: '', last_maintenance_date: '',
    maintenance_interval_days: 30, status: 'Operational',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Machine Name</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Location</label>
        <input required value={form.location} onChange={e => set('location', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Last Maintenance</label>
          <input required type="date" value={form.last_maintenance_date} onChange={e => set('last_maintenance_date', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Interval (days)</label>
          <input required type="number" min="1" value={form.maintenance_interval_days} onChange={e => set('maintenance_interval_days', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Status</label>
        <select value={form.status} onChange={e => set('status', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-gray-950 text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Machine'}
        </button>
      </div>
    </form>
  )
}

export default function Machines() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('default')
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const { data, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: () => machinesApi.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: machinesApi.create,
    onSuccess: () => { qc.invalidateQueries(['machines']); setShowModal(false) },
  })

  const machines = (data?.data?.data || []).filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.location.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || m.status === statusFilter
    return matchSearch && matchStatus
  }).sort((a, b) => {
    if (sortBy === 'operational-first') {
      const order = { 'Operational': 0, 'Needs Maintenance': 1, 'Under Maintenance': 2 }
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
    }
    if (sortBy === 'critical-first') {
      const order = { 'Needs Maintenance': 0, 'Under Maintenance': 1, 'Operational': 2 }
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
    }
    if (sortBy === 'most-overdue') {
      return (b.days_overdue || 0) - (a.days_overdue || 0)
    }
    return a.machine_id - b.machine_id
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Machines"
        subtitle={`${machines.length} machine${machines.length !== 1 ? 's' : ''} found`}
        action={
          user?.role === 'admin' && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-gray-950 rounded-lg text-sm font-medium hover:bg-cyan-400 transition-colors">
              <Plus size={16} /> Add Machine
            </button>
          )
        }
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search machines..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 border border-gray-800 hover:border-gray-700'
              }`}>
              {s}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 border border-gray-800 bg-gray-900 focus:outline-none focus:border-cyan-500 hover:border-gray-700 transition-colors">
          <option value="default">Default order</option>
          <option value="operational-first">Operational first</option>
          <option value="critical-first">Needs maintenance first</option>
          <option value="most-overdue">Most overdue first</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading machines...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {machines.map(machine => (
            <Link key={machine.machine_id} to={`/machines/${machine.machine_id}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-black/20 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Cpu size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">{machine.name}</p>
                    <p className="text-xs text-gray-500">ID #{machine.machine_id}</p>
                  </div>
                </div>
                <StatusBadge status={machine.status} />
              </div>
              <div className="space-y-1.5 mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin size={12} className="text-gray-600" /> {machine.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={12} className="text-gray-600" /> Next due: {new Date(machine.next_due_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={12} className="text-gray-600" /> Every {machine.maintenance_interval_days} days
                </div>
              </div>
              {machine.days_overdue > 0 && (
                <div className="mt-3 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">{machine.days_overdue} days overdue</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add New Machine" onClose={() => setShowModal(false)}>
          <MachineForm
            onClose={() => setShowModal(false)}
            loading={createMutation.isPending}
            onSubmit={(data) => createMutation.mutate(data)}
          />
        </Modal>
      )}
    </div>
  )
}