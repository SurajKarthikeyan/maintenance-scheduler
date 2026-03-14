import axios from 'axios'

export const machineClient = axios.create({
  baseURL: import.meta.env.VITE_MACHINE_URL || 'http://localhost:3001',
})

export const schedulerClient = axios.create({
  baseURL: import.meta.env.VITE_SCHEDULER_URL || 'http://localhost:3002',
})

export const alertClient = axios.create({
  baseURL: import.meta.env.VITE_ALERT_URL || 'http://localhost:3003',
})