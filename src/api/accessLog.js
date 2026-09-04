import request from '@/services/http/client'

export const getAccessLogList = (params) => request.get('/api/access-logs/', { params })

export const getAccessLogProfiles = (params) =>
  request.get('/api/access-logs/profiles/', { params })

export const getAccessLogProfileDetail = (ip) =>
  request.get('/api/access-logs/profile/', { params: { ip } })

export const getAccessLogRules = () =>
  request.get('/api/access-log-rules/')

export const createAccessLogRule = (data) =>
  request.post('/api/access-log-rules/', data)

export const revokeAccessLogRule = (ruleId) =>
  request.post(`/api/access-log-rules/${ruleId}/revoke/`)
