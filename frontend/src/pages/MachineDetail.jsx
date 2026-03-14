import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Calendar, Clock, Edit2, Plus, Trash2 } from 'lucide-react'
import { machinesApi } from '../api/machines'
import { tasksApi } from '../api/tasks'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

const TASK_STATUSES = ['Scheduled', 'Pending', 'In Progress', 'Completed']
const MACHINE_STATUSES = ['Operational', 'Needs Maintenance', 'Under Maintenance']

export default function MachineDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ task_description: '', scheduled_date: '', status: 'Scheduled' })
  const [editForm, setEditForm] = useState({})
  const [editingTaskId, setEditingTaskId] = useState(null)

  const { data: machineRes, isLoading } = useQuery({
    queryKey: ['machine', id],
    queryFn: () => machinesApi.getById(id),
  })

  const { data: tasksRes } = useQuery({
    queryKey: ['tasks-machine', id],
    queryFn: () => tasksApi.getByMachine(id),
  })

  const createTask = useMutation({
    mutationFn: (data) => editingTaskId
      ? tasksApi.update(editingTaskId, data)
      : tasksApi.create({ ...data, machine_id: id }),
    onSuccess: () => {
      qc.invalidateQueries(['tasks-machine', id])
      setShowTaskModal(false)
      setEditingTaskId(null)
      setTaskForm({ task_description: '', scheduled_date: '', status: 'Scheduled' })
    },
  })

  const updateMachine = useMutation({
    mutationFn: (data) => machinesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['machine', id]); qc.invalidateQueries(['machines']); setShowEditModal(false) },
  })

  const deleteMachine = useMutation({
    mutationFn: () => machinesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['machines']); navigate('/machines') },
  })

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }) => tasksApi.update(taskId, data),
    onSuccess: () => { qc.invalidateQueries(['tasks-machine', id]); qc.invalidateQueries(['machines']) },
  })

  const deleteTask = useMutation({
    mutationFn: (taskId) => tasksApi.delete(taskId),
    onSuccess: () => qc.invalidateQueries(['tasks-machine', id]),
  })

  const machine = machineRes?.data?.data
  const tasks = tasksRes?.data?.data || []

  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>
  if (!machine) return <div className="p-8 text-gray-500">Machine not found.</div>

function exportCSV() {
  const headers = ['Task ID', 'Description', 'Scheduled Date', 'Status', 'Completed On']
  const rows = tasks.map(t => [
    t.task_id,
    t.task_description,
    new Date(t.scheduled_date).toLocaleDateString(),
    t.status,
    t.completed_on ? new Date(t.completed_on).toLocaleDateString() : ''
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${machine.name}-maintenance-history.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF() {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html>
      <head>
        <title>${machine.name} - Maintenance History</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
          .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .info-box { background: #f5f5f5; border-radius: 8px; padding: 12px; }
          .info-label { font-size: 11px; color: #888; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #111; color: white; text-align: left; padding: 10px 12px; font-size: 12px; }
          td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) td { background: #f9f9f9; }
          .status { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-scheduled { background: #dbeafe; color: #1e40af; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-progress { background: #ede9fe; color: #5b21b6; }
          .footer { margin-top: 32px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
          .overdue { background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>${machine.name}</h1>
        <div class="meta">Maintenance History Report · Generated ${new Date().toLocaleDateString()}</div>
        ${machine.days_overdue > 0 ? `<div class="overdue">⚠ This machine is ${machine.days_overdue} days overdue for maintenance</div>` : ''}
        <div class="info-grid">
          <div class="info-box"><div class="info-label">Location</div><div class="info-value">${machine.location}</div></div>
          <div class="info-box"><div class="info-label">Status</div><div class="info-value">${machine.status}</div></div>
          <div class="info-box"><div class="info-label">Last Serviced</div><div class="info-value">${new Date(machine.last_maintenance_date).toLocaleDateString()}</div></div>
          <div class="info-box"><div class="info-label">Next Due</div><div class="info-value">${new Date(machine.next_due_date).toLocaleDateString()}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td>${t.task_id}</td>
                <td>${t.task_description}</td>
                <td>${new Date(t.scheduled_date).toLocaleDateString()}</td>
                <td><span class="status status-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span></td>
                <td>${t.completed_on ? new Date(t.completed_on).toLocaleDateString() : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${machine.notes ? `<div style="margin-top:24px"><strong>Notes:</strong><p style="color:#444;margin-top:4px">${machine.notes}</p></div>` : ''}
        <div class="footer">MaintainX · NTT Data Case Study · Machine ID #${machine.machine_id}</div>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}



  return (
    <div className="p-8">
      <Link to="/machines" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Machines
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{machine.name}</h1>
            <p className="text-sm text-gray-500 mt-1">ID #{machine.machine_id}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={machine.status} />
            {user?.role === 'admin' && (
              <>
                <button onClick={() => { setEditForm(machine); setShowEditModal(true) }}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => { if(window.confirm('Delete this machine?')) deleteMachine.mutate() }}
                  className="p-2 rounded-lg border border-red-700 text-red-400 hover:text-red-300 hover:border-red-600 transition-colors">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { icon: MapPin,   label: 'Location',     value: machine.location },
            { icon: Calendar, label: 'Last Serviced', value: new Date(machine.last_maintenance_date).toLocaleDateString() },
            { icon: Calendar, label: 'Next Due',      value: new Date(machine.next_due_date).toLocaleDateString() },
            { icon: Clock,    label: 'Interval',      value: `Every ${machine.maintenance_interval_days} days` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={12} className="text-gray-500" />
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              <p className="text-sm text-white font-medium">{value}</p>
            </div>
          ))}
        </div>

        {machine.days_overdue > 0 && (
          <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">⚠ This machine is {machine.days_overdue} days overdue for maintenance</p>
          </div>
        )}
      </div>

      {machine.notes && (
        <div className="mt-4 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-300">{machine.notes}</p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Maintenance Tasks</h2>
          <div className="flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-700 text-gray-400 rounded-lg text-xs hover:bg-gray-800 transition-colors">
              Export CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-700 text-gray-400 rounded-lg text-xs hover:bg-gray-800 transition-colors">
              Export PDF
            </button>
            <button onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 text-gray-950 rounded-lg text-xs font-medium hover:bg-cyan-400 transition-colors">
              <Plus size={14} /> Schedule Task
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No tasks scheduled for this machine</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.task_id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-sm text-gray-200">{task.task_description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Scheduled: {new Date(task.scheduled_date).toLocaleDateString()}
                    {task.completed_on && ` · Completed: ${new Date(task.completed_on).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  {task.status !== 'Completed' && (
                    <select value={task.status}
                      onChange={e => updateTask.mutate({ taskId: task.task_id, data: { status: e.target.value } })}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500">
                      {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => { setTaskForm({ task_description: task.task_description, scheduled_date: task.scheduled_date.split('T')[0], status: task.status }); setEditingTaskId(task.task_id); setShowTaskModal(true) }}
                        className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask.mutate(task.task_id)}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskModal && (
        <Modal title={editingTaskId ? "Edit Task" : "Schedule Maintenance Task"} onClose={() => { setShowTaskModal(false); setEditingTaskId(null); setTaskForm({ task_description: '', scheduled_date: '', status: 'Scheduled' }) }}>
          <form onSubmit={e => { e.preventDefault(); createTask.mutate(taskForm) }} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Task Description</label>
              <input required value={taskForm.task_description}
                onChange={e => setTaskForm(f => ({ ...f, task_description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Scheduled Date</label>
              <input required type="date" value={taskForm.scheduled_date}
                onChange={e => setTaskForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createTask.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-gray-950 text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {createTask.isPending ? 'Saving...' : editingTaskId ? 'Save Changes' : 'Schedule Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && (
        <Modal title="Edit Machine" onClose={() => setShowEditModal(false)}>
          <form onSubmit={e => { e.preventDefault(); updateMachine.mutate({ ...editForm, last_maintenance_date: editForm.last_maintenance_date?.split('T')[0] }) }} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                {MACHINE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Maintenance Interval (days)</label>
              <input type="number" min="1" value={editForm.maintenance_interval_days}
                onChange={e => setEditForm(f => ({ ...f, maintenance_interval_days: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Last Maintenance Date</label>
              <input type="date" value={editForm.last_maintenance_date?.split('T')[0]}
                onChange={e => setEditForm(f => ({ ...f, last_maintenance_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea
                value={editForm.notes || ''}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Add any notes about this machine..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={updateMachine.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-gray-950 text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {updateMachine.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}