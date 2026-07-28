import request from '@/services/http/client'
export const getAccessLogList = (params) => request.get('/api/access-logs/', { params })
