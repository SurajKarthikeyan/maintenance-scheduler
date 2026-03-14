import { machineClient } from './client'

export const machinesApi = {
  getAll: (params) => machineClient.get('/api/machines', { params }),
  getById: (id) => machineClient.get(`/api/machines/${id}`),
  getOverdue: () => machineClient.get('/api/machines/overdue'),
  create: (data) => machineClient.post('/api/machines', data),
  update: (id, data) => machineClient.patch(`/api/machines/${id}`, data),
  delete: (id) => machineClient.delete(`/api/machines/${id}`),
}