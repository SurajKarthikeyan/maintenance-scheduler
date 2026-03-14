import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { tasksApi } from '../api/tasks'
import { machinesApi } from '../api/machines'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'

const STATUSES = ['Scheduled', 'Pending', 'In Progress', 'Completed']

export default function Tasks() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [machineFilter, setMachineFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ machine_id: '', task_description: '', scheduled_date: '', status: 'Scheduled' })
  const qc = useQueryClient()

  const { data: tasksRes, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  })

  const { data: machinesRes } = useQuery({
    queryKey: ['machines'],
    queryFn: () => machinesApi.getAll(),
  })

  const createTask = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => { qc.invalidateQueries(['tasks']); setShowModal(false) },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['machines']) },
  })

  const deleteTask = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => qc.invalidateQueries(['tasks']),
  })

  const machines = machinesRes?.data?.data || []

  const tasks = (tasksRes?.data?.data || []).filter(t => {
    const matchSearch = t.task_description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || t.status === statusFilter
    const matchMachine = machineFilter === 'All' || t.machine_id === parseInt(machineFilter)
    return matchSearch && matchStatus && matchMachine
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Maintenance Tasks"
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''} found`}
        action={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-gray-950 rounded-lg text-sm font-medium hover:bg-cyan-400 transition-colors">
            <Plus size={16} /> New Task
          </button>
        }
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>

        {/* Machine filter */}
        <select value={machineFilter} onChange={e => setMachineFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 border border-gray-800 bg-gray-900 focus:outline-none focus:border-cyan-500 hover:border-gray-700 transition-colors">
          <option value="All">All machines</option>
          {[...machines].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
            <option key={m.machine_id} value={m.machine_id}>{m.name}</option>
          ))}
        </select>

        {/* Status filter */}
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
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No tasks found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Task</th>
                <th className="text-left px-5 py-3">Machine</th>
                <th className="text-left px-5 py-3">Scheduled</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Update</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tasks.map(task => (
                <tr key={task.task_id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-gray-200">{task.task_description}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {machines.find(m => m.machine_id === task.machine_id)?.name || `Machine #${task.machine_id}`}
                  </td>
                  <td className="px-5 py-3 text-gray-400">{new Date(task.scheduled_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-5 py-3">
                    {task.status !== 'Completed' && (
                      <select value={task.status}
                        onChange={e => updateTask.mutate({ id: task.task_id, data: { status: e.target.value } })}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500">
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {task.status !== 'Completed' && (
                      <button onClick={() => deleteTask.mutate(task.task_id)}
                        className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Schedule New Task" onClose={() => setShowModal(false)}>
          <form onSubmit={e => { e.preventDefault(); createTask.mutate(form) }} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Machine</label>
              <select required value={form.machine_id} onChange={e => setForm(f => ({ ...f, machine_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="">Select a machine...</option>
                  {[...machines].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                      <option key={m.machine_id} value={m.machine_id}>{m.name}</option>
                    ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Task Description</label>
              <input required value={form.task_description} onChange={e => setForm(f => ({ ...f, task_description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Scheduled Date</label>
              <input required type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createTask.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-gray-950 text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {createTask.isPending ? 'Scheduling...' : 'Schedule Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}