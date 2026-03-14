import { schedulerClient } from './client'

export const tasksApi = {
  getAll: (params) => schedulerClient.get('/api/tasks', { params }),
  getById: (id) => schedulerClient.get(`/api/tasks/${id}`),
  getUpcoming: (days = 7) => schedulerClient.get(`/api/tasks/upcoming?days=${days}`),
  getOverdue: () => schedulerClient.get('/api/tasks/overdue'),
  getByMachine: (machineId) => schedulerClient.get(`/api/tasks/machine/${machineId}`),
  create: (data) => schedulerClient.post('/api/tasks', data),
  update: (id, data) => schedulerClient.patch(`/api/tasks/${id}`, data),
  delete: (id) => schedulerClient.delete(`/api/tasks/${id}`),
}