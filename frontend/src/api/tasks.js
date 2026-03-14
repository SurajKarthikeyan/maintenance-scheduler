
import client from './client'

export const tasksApi = {
  getAll: (params) => client.get('/api/tasks', { params }),
  getById: (id) => client.get(`/api/tasks/${id}`),
  getUpcoming: (days = 7) => client.get(`/api/tasks/upcoming?days=${days}`),
  getOverdue: () => client.get('/api/tasks/overdue'),
  getByMachine: (machineId) => client.get(`/api/tasks/machine/${machineId}`),
  create: (data) => client.post('/api/tasks', data),
  update: (id, data) => client.patch(`/api/tasks/${id}`, data),
  delete: (id) => client.delete(`/api/tasks/${id}`),
}