import client from './client'

export const authApi = {
  login: (credentials) => client.post('/api/auth/login', credentials),
  me: () => client.get('/api/auth/me'),
  getUsers: () => client.get('/api/auth/users'),
  register: (data) => client.post('/api/auth/register', data),
  removeUser: (id) => client.delete(`/api/auth/users/${id}`),
}