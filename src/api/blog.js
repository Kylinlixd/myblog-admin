import request from '@/utils/request'
import { cachedRequest } from '@/services/http/publicRequestCache'

const LEGACY_BLOG_API_PREFIX = '/blog'
const BLOG_API_PREFIX = '/api/blog'

export function createBlogApiUrl(path = '') {
  const cleanPath = String(path).trim()

  if (!cleanPath || cleanPath === BLOG_API_PREFIX || cleanPath === LEGACY_BLOG_API_PREFIX) {
    return `${BLOG_API_PREFIX}/`
  }

  if (cleanPath.startsWith(`${BLOG_API_PREFIX}/`)) {
    return cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`
  }

  const withoutLegacyPrefix = cleanPath.startsWith(`${LEGACY_BLOG_API_PREFIX}/`)
    ? cleanPath.slice(LEGACY_BLOG_API_PREFIX.length)
    : cleanPath
  const normalizedPath = withoutLegacyPrefix.replace(/^\/+|\/+$/g, '')
  return `${BLOG_API_PREFIX}/${normalizedPath}/`
}

function getPublicBlog(path, params) {
  const url = createBlogApiUrl(path)
  const query = JSON.stringify(params || {})
  return cachedRequest(`GET:${url}?${query}`, () => request.get(url, params ? { params } : undefined))
}

export const getBlogCategoryList = () =>
  getPublicBlog('categories')

export const getBlogDynamics = (params) =>
  request.get(createBlogApiUrl('dynamics'), { params })

export const getBlogDynamicDetail = (id) =>
  request.get(createBlogApiUrl(`dynamics/${id}`))

export const getAdjacentDynamics = (id) =>
  request.get(createBlogApiUrl(`dynamics/${id}/adjacent`))

export const getHotDynamics = (params) =>
  getPublicBlog('dynamics/hot', params)

export const getRecentDynamics = (params) =>
  getPublicBlog('dynamics/recent', params)

export const getCategoryDynamics = (categoryId, params) =>
  request.get(createBlogApiUrl(`categories/${categoryId}/dynamics`), { params })

export const getTagDynamics = (tagId, params) =>
  request.get(createBlogApiUrl(`tags/${tagId}/dynamics`), { params })

export const getBlogTagList = () =>
  getPublicBlog('tags')

export const increaseDynamicView = (id) =>
  request.put(createBlogApiUrl(`dynamics/${id}/view`))

export const likeDynamic = (id) =>
  request.post(createBlogApiUrl(`dynamics/${id}/like`))

export const commentDynamic = (id, data) =>
  request.post(createBlogApiUrl('comments'), {
    dynamic_id: id,
    content: data.content,
    nickname: data.nickname,
    email: data.email
  })

export const getDynamicComments = (id, params) =>
  request.get(createBlogApiUrl('comments'), {
    params: { ...params, dynamic_id: id }
  })

export const searchBlog = (params) =>
  request.get(createBlogApiUrl('search'), { params })
