import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Shield, User } from 'lucide-react'
import { authApi } from '../api/auth'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'

export default function Users() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'technician' })
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  })

  const createUser = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      qc.invalidateQueries(['users'])
      setShowModal(false)
      setForm({ username: '', password: '', role: 'technician' })
    },
  })

  const removeUser = useMutation({
    mutationFn: authApi.removeUser,
    onSuccess: () => qc.invalidateQueries(['users']),
  })

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  const users = data?.data?.data || []

  return (
    <div className="p-8">
      <PageHeader
        title="User Management"
        subtitle="Manage who has access to the system"
        action={
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-gray-950 rounded-lg text-sm font-medium hover:bg-cyan-400 transition-colors">
            <Plus size={16} /> Add User
          </button>
        }
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr className="text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Username</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map(user => (
                <tr key={user.user_id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        {user.role === 'admin'
                          ? <Shield size={14} className="text-cyan-400" />
                          : <User size={14} className="text-gray-400" />
                        }
                      </div>
                      <span className="text-gray-200 font-medium">{user.username}</span>
                      {user.user_id === currentUser?.user_id && (
                        <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {user.user_id !== currentUser?.user_id && (
                      <button
                        onClick={() => { if (window.confirm(`Remove ${user.username}?`)) removeUser.mutate(user.user_id) }}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
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
        <Modal title="Add New User" onClose={() => setShowModal(false)}>
          <form onSubmit={e => { e.preventDefault(); createUser.mutate(form) }} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Username</label>
              <input required value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input required type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createUser.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-gray-950 text-sm font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {createUser.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}