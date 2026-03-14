import { alertClient } from './client'

export const alertsApi = {
  getAll: (params) => alertClient.get('/api/alerts', { params }),
  getById: (id) => alertClient.get(`/api/alerts/${id}`),
  resolve: (id) => alertClient.patch(`/api/alerts/${id}/resolve`),
  triggerCheck: () => alertClient.post('/api/alerts/check'),
}