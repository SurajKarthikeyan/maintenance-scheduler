import client from './client'

export const alertsApi = {
  getAll: (params) => client.get('/api/alerts', { params }),
  getById: (id) => client.get(`/api/alerts/${id}`),
  resolve: (id) => client.patch(`/api/alerts/${id}/resolve`),
  triggerCheck: () => client.post('/api/alerts/check'),
}