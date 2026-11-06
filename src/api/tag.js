import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'
import { clearRequestCache } from '@/services/http/publicRequestCache'
import { t } from '@/i18n'

export async function getTagList(params) {
  const response = await request.get('/api/tags/', { params })
  return normalizeCollectionResponse(response)
}

// 标签名会出现在公开页的搜索下拉与文章标签流：写操作后清掉公开页 30s 缓存
export const createTag = async (data) => {
  const result = await unwrapApiResponse(await request.post('/api/tags/', data), t('tagMgr.createFailed'))
  clearRequestCache()
  return result
}

export const updateTag = async (id, data) => {
  const result = await unwrapApiResponse(await request.put(`/api/tags/${id}/`, data), t('tagMgr.updateFailed'))
  clearRequestCache()
  return result
}

export const deleteTag = async (id) => {
  const result = await unwrapApiResponse(await request.delete(`/api/tags/${id}/`), t('tagMgr.deleteFailed'))
  clearRequestCache()
  return result
}
