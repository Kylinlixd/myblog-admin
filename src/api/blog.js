import request from '@/utils/request'

const BLOG_API_PREFIX = '/blog'

export function createBlogApiUrl(path = '') {
  const cleanPath = String(path).trim()

  if (!cleanPath || cleanPath === BLOG_API_PREFIX) {
    return `${BLOG_API_PREFIX}/`
  }

  if (cleanPath.startsWith(`${BLOG_API_PREFIX}/`)) {
    return cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`
  }

  const normalizedPath = cleanPath.replace(/^\/+|\/+$/g, '')
  return `${BLOG_API_PREFIX}/${normalizedPath}/`
}

export const getBlogCategoryList = () =>
  request.get(createBlogApiUrl('categories'))

export const getBlogDynamics = (params) =>
  request.get(createBlogApiUrl('dynamics'), { params })

export const getBlogDynamicDetail = (id) =>
  request.get(createBlogApiUrl(`dynamics/${id}`))

export const getAdjacentDynamics = (id) =>
  request.get(createBlogApiUrl(`dynamics/${id}/adjacent`))

export const getHotDynamics = (params) =>
  request.get(createBlogApiUrl('dynamics/hot'), { params })

export const getRecentDynamics = (params) =>
  request.get(createBlogApiUrl('dynamics/recent'), { params })

export const getCategoryDynamics = (categoryId, params) =>
  request.get(createBlogApiUrl(`categories/${categoryId}/dynamics`), { params })

export const searchBlogDynamics = (params) =>
  request.get(createBlogApiUrl('dynamics/search'), { params })

export const getTagDynamics = (tagId, params) =>
  request.get(createBlogApiUrl(`tags/${tagId}/dynamics`), { params })

export const getBlogTagList = () =>
  request.get(createBlogApiUrl('tags'))

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

export const deleteDynamicComment = (dynamicId, commentId) =>
  request.delete(createBlogApiUrl(`dynamics/${dynamicId}/comments/${commentId}`))

export const getBlogStats = () =>
  request.get(createBlogApiUrl('stats'))

export const getAboutInfo = () =>
  request.get(createBlogApiUrl('about'))

export const updateAboutInfo = (data) =>
  request.put(createBlogApiUrl('about'), data)

export const searchBlog = (params) =>
  request.get(createBlogApiUrl('search'), { params })
