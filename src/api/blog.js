import axios from 'axios'
import { getEnvValue } from '../utils/env'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

// 获取前台API路径前缀，始终使用/blog
const getBlogApiPrefix = () => {
  // 不使用VITE_API_BASE_URL，避免与后台API混淆
  const prefix = getEnvValue('VITE_BLOG_API_BASE_URL', '/blog')
  console.log(`[Blog] 使用API前缀: ${prefix}`)
  return prefix
}

// 创建专用于博客前台的axios实例
const blogAxios = axios.create({
  baseURL: '', // 设置为空，避免与全局环境变量冲突
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 禁用默认baseURL，确保不会被环境变量覆盖
delete blogAxios.defaults.baseURL

/**
 * 创建博客API URL
 * @param {string} path - API路径
 * @returns {string} 完整的API URL
 */
export function createBlogApiUrl(path) {
  // 如果路径已经以/blog开头，直接返回，避免重复前缀
  if (path.startsWith('/blog/')) {
    console.log(`[Blog] URL已包含/blog前缀，保持不变: ${path}`);
    return path;
  }
  
  // 确保path不以/开头，避免出现双斜杠
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  // 统一返回blog API格式
  const url = `/blog/${cleanPath}`;
  console.log(`[Blog] 创建URL: ${url}`);
  return url;
}

// 请求拦截器
blogAxios.interceptors.request.use(
  config => {
    // 强制覆盖baseURL，确保使用正确的路径前缀
    config.baseURL = '';
    
    // 确保URL以/blog开头，避免使用环境变量
    if (config.url && !config.url.startsWith('/blog/')) {
      // 使用修正后的createBlogApiUrl函数确保正确添加前缀
      config.url = createBlogApiUrl(config.url)
    }
    
    // 详细记录请求信息，帮助调试
    console.log(`[Blog] 发送请求:`, {
      方法: config.method.toUpperCase(),
      URL: config.url,
      完整请求URL: (config.baseURL || '') + config.url,
      参数: config.params || {}
    });
    
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
blogAxios.interceptors.response.use(
  response => {
    console.log(`[Blog] 接收响应:`, {
      URL: response.config.url,
      状态: response.status,
      响应数据类型: typeof response.data
    });
    return response.data
  },
  error => {
    console.error('博客API请求错误:', error)
    return Promise.reject(error)
  }
)

/**
 * 获取博客分类列表
 * @returns {Promise} 分类列表
 */
export function getBlogCategoryList() {
  return request({
    url: createBlogApiUrl('categories'),
    method: 'get'
  }).catch(error => {
    console.error('获取博客分类列表失败:', error)
    throw error
  })
}

/**
 * 获取博客动态列表
 * @param {Object} params 分页参数
 * @returns {Promise} 动态列表
 */
export function getBlogDynamics(params) {
  return blogAxios.get(createBlogApiUrl('dynamics'), { params })
    .catch(error => {
      console.error('获取博客动态列表失败:', error)
      throw error
    })
}

/**
 * 获取博客动态详情
 * @param {string} id 动态ID
 * @returns {Promise} 动态详情
 */
export function getBlogDynamicDetail(id) {
  return blogAxios.get(createBlogApiUrl(`dynamics/${id}`))
    .catch(error => {
      console.error('获取博客动态详情失败:', error)
      throw error
    })
}

/**
 * 获取相邻的博客动态
 * @param {string} id 动态ID
 * @returns {Promise} 相邻动态
 */
export function getAdjacentDynamics(id) {
  return request({
    url: createBlogApiUrl(`dynamics/${id}/adjacent`),
    method: 'get'
  }).catch(error => {
    console.error('获取相邻博客动态失败:', error)
    throw error
  })
}

/**
 * 获取热门博客动态
 * @param {Object} params 查询参数
 * @returns {Promise} 热门动态
 */
export function getHotDynamics(params) {
  return request({
    url: createBlogApiUrl('dynamics/hot'),
    method: 'get',
    params
  }).catch(error => {
    console.error('获取热门博客动态失败:', error)
    throw error
  })
}

/**
 * 获取最近博客动态
 * @param {Object} params 查询参数
 * @returns {Promise} 最近动态
 */
export function getRecentDynamics(params) {
  return request({
    url: createBlogApiUrl('dynamics/recent'),
    method: 'get',
    params
  }).catch(error => {
    console.error('获取最近博客动态失败:', error)
    throw error
  })
}

/**
 * 获取分类下的博客动态
 * @param {string} categoryId 分类ID
 * @param {Object} params 分页参数
 * @returns {Promise} 动态列表
 */
export function getCategoryDynamics(categoryId, params) {
  return request({
    url: createBlogApiUrl(`categories/${categoryId}/dynamics`),
    method: 'get',
    params
  }).catch(error => {
    console.error('获取分类下的博客动态失败:', error)
    throw error
  })
}

/**
 * 获取标签下的博客动态
 * @param {string} tagId 标签ID
 * @param {Object} params 分页参数
 * @returns {Promise} 动态列表
 */
export function getTagDynamics(tagId, params) {
  return request({
    url: createBlogApiUrl(`tags/${tagId}/dynamics`),
    method: 'get',
    params
  }).catch(error => {
    console.error('获取标签下的博客动态失败:', error)
    throw error
  })
}

/**
 * 获取标签列表
 * @returns {Promise} 标签列表
 */
export function getBlogTagList() {
  return request({
    url: createBlogApiUrl('tags'),
    method: 'get'
  }).catch(error => {
    console.error('获取博客标签列表失败:', error)
    throw error
  })
}

/**
 * 增加动态浏览量
 * @param {string} id 动态ID
 * @returns {Promise}
 */
export function increaseDynamicView(id) {
  return blogAxios.put(createBlogApiUrl(`dynamics/${id}/view`))
    .then(response => response.data)
    .catch(error => {
      console.error('增加浏览量失败:', error)
      throw error
    })
}

/**
 * 创建动态
 * @param {Object} data 动态数据
 * @returns {Promise} 新创建的动态
 */
export function createDynamic(data) {
  return blogAxios.post(createBlogApiUrl('dynamics'), data)
    .then(response => response.data)
    .catch(error => {
      console.error('创建动态失败:', error)
      throw error
    })
}

/**
 * 更新动态
 * @param {string} id 动态ID
 * @param {Object} data 动态数据
 * @returns {Promise} 更新后的动态
 */
export function updateDynamic(id, data) {
  return blogAxios.put(createBlogApiUrl(`dynamics/${id}`), data)
    .then(response => response.data)
    .catch(error => {
      console.error('更新动态失败:', error)
      throw error
    })
}

/**
 * 删除动态
 * @param {string} id 动态ID
 * @returns {Promise}
 */
export function deleteDynamic(id) {
  return blogAxios.delete(createBlogApiUrl(`dynamics/${id}`))
    .then(response => response.data)
    .catch(error => {
      console.error('删除动态失败:', error)
      throw error
    })
}

/**
 * 点赞博客动态
 * @param {string} id 动态ID
 * @returns {Promise} 点赞结果
 */
export function likeDynamic(id) {
  return request({
    url: createBlogApiUrl(`dynamics/${id}/like`),
    method: 'post'
  }).catch(error => {
    console.error('点赞博客动态失败:', error)
    throw error
  })
}

/**
 * 评论博客动态
 * @param {string} id 动态ID
 * @param {Object} data 评论内容
 * @returns {Promise} 评论结果
 */
export function commentDynamic(id, data) {
  return request({
    url: createBlogApiUrl(`dynamics/${id}/comments`),
    method: 'post',
    data
  }).catch(error => {
    console.error('评论博客动态失败:', error)
    throw error
  })
}

/**
 * 获取博客动态评论
 * @param {string} id 动态ID
 * @param {Object} params 分页参数
 * @returns {Promise} 评论列表
 */
export function getDynamicComments(id, params) {
  return request({
    url: createBlogApiUrl(`dynamics/${id}/comments`),
    method: 'get',
    params
  }).catch(error => {
    console.error('获取博客动态评论失败:', error)
    throw error
  })
}

/**
 * 删除博客动态评论
 * @param {string} dynamicId 动态ID
 * @param {string} commentId 评论ID
 * @returns {Promise} 删除结果
 */
export function deleteDynamicComment(dynamicId, commentId) {
  return request({
    url: createBlogApiUrl(`dynamics/${dynamicId}/comments/${commentId}`),
    method: 'delete'
  }).catch(error => {
    console.error('删除博客动态评论失败:', error)
    throw error
  })
}

/**
 * 获取博客统计数据
 * @returns {Promise} 统计数据
 */
export function getBlogStats() {
  return request({
    url: createBlogApiUrl('stats'),
    method: 'get'
  }).catch(error => {
    console.error('获取博客统计数据失败:', error)
    throw error
  })
}

/**
 * 获取关于页面信息
 * @returns {Promise} 关于页面数据
 */
export function getAboutInfo() {
  return request({
    url: createBlogApiUrl('about'),
    method: 'get'
  }).catch(error => {
    console.error('获取关于页面信息失败:', error)
    throw error
  })
}

/**
 * 更新关于页面信息
 * @param {Object} data 关于页面数据
 * @returns {Promise} 更新结果
 */
export function updateAboutInfo(data) {
  return request({
    url: createBlogApiUrl('about'),
    method: 'put',
    data
  }).catch(error => {
    console.error('更新关于页面信息失败:', error)
    throw error
  })
}

