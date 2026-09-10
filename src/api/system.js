import request from '@/services/http/client'

export const getSystemHealth = (config) => request.get('/api/system/health/', config)
