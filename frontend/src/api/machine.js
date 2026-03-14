import client from './client'

export const machinesApi = {
  getAll: (params) => client.get('/api/machines', { params }),
  getById: (id) => client.get(`/api/machines/${id}`),
  getOverdue: () => client.get('/api/machines/overdue'),
  create: (data) => client.post('/api/machines', data),
  update: (id, data) => client.patch(`/api/machines/${id}`, data),
  delete: (id) => client.delete(`/api/machines/${id}`),
}