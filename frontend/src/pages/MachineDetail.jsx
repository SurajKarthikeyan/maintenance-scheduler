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

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Maintenance Tasks</h2>
          <button onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 text-gray-950 rounded-lg text-xs font-medium hover:bg-cyan-400 transition-colors">
            <Plus size={14} /> Schedule Task
          </button>
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
          <form onSubmit={e => { e.preventDefault(); updateMachine.mutate(editForm) }} className="space-y-4">
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