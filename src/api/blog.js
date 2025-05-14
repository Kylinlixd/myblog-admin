import axios from 'axios'
import { getEnvValue } from '../utils/env'
import { message } from 'ant-design-vue'
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
  baseURL: '', // 使用相对路径，通过开发服务器代理
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 禁用默认baseURL覆盖
// delete blogAxios.defaults.baseURL

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
  
  // 处理直接访问/blog路径的情况
  if (path === '/blog') {
    console.log(`[Blog] 请求/blog路径，修正为/blog/`);
    return '/blog/';
  }
  
  // 确保path不以/开头，避免出现双斜杠
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  // 使用相对路径，通过开发服务器代理转发
  const url = `/blog/${cleanPath}`;
  console.log(`[Blog] 创建URL: ${url}`);
  return url;
}

// 请求拦截器
blogAxios.interceptors.request.use(
  config => {
    // 不要覆盖baseURL，保持为空或相对路径
    // config.baseURL = ''; - 删除这行
    
    // 确保URL以/blog开头
    if (config.url && !config.url.startsWith('/blog/')) {
      // 使用修正后的createBlogApiUrl函数确保正确添加前缀
      config.url = createBlogApiUrl(config.url)
    }
    
    // 详细记录请求信息，帮助调试
    console.log(`[Blog] 发送请求:`, {
      方法: config.method.toUpperCase(),
      URL: config.url,
      完整请求URL: window.location.origin + config.url,
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
    
    // 检查响应数据格式
    if (response.data && typeof response.data === 'object') {
      // 如果是标准格式 {code: 200, data: {...}}
      if (response.data.code === 200) {
        return response.data;
      }
      
      // 如果是直接返回的数据对象
      if (response.data.list || Array.isArray(response.data)) {
        return {
          code: 200,
          message: 'success',
          data: response.data
        };
      }
    }
    
    // 如果响应格式不符合预期，返回错误
    return Promise.reject({
      code: 500,
      message: '响应格式错误',
      data: response.data
    });
  },
  error => {
    console.error('博客API请求错误:', error);
    
    // 处理网络错误
    if (!error.response) {
      // 移除默认错误提示
      // message.error('网络连接失败，请检查网络设置');
      return Promise.reject({
        code: 500,
        message: '网络连接失败',
        error: error.message
      });
    }
    
    // 处理HTTP错误
    const status = error.response.status;
    let errorMessage = '操作失败，请稍后重试';
    
    switch (status) {
      case 400:
        errorMessage = '请求参数错误';
        break;
      case 401:
        errorMessage = '未授权，请重新登录';
        break;
      case 403:
        errorMessage = '拒绝访问';
        break;
      case 404:
        errorMessage = '请求的资源不存在';
        break;
      case 500:
        errorMessage = '服务器内部错误';
        break;
      default:
        errorMessage = `请求失败(${status})`;
    }
    
    // 移除默认错误提示
    // message.error(errorMessage);
    
    return Promise.reject({
      code: status,
      message: errorMessage,
      error: error.response.data
    });
  }
)

/**
 * 获取博客分类列表
 * @returns {Promise} 分类列表
 */
export function getBlogCategoryList() {
  return blogAxios.get(createBlogApiUrl('categories/'))
    .catch(error => {
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
  console.log('[Blog API] 获取动态列表, 参数:', params);
  
  // 模拟数据
  const mockData = {
    code: 200,
    message: 'success',
    data: {
      list: [
        {
          id: 1,
          title: '欢迎来到我的博客',
          content: '这是我的第一篇博客文章，欢迎访问！',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          views: 100,
          likes: 10,
          comments: 5
        },
        {
          id: 2,
          title: '技术分享：Vue.js 3.0 新特性',
          content: 'Vue.js 3.0带来了很多激动人心的新特性，让我们一起来看看吧！',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          views: 80,
          likes: 8,
          comments: 3
        }
      ],
      total: 2,
      page: params?.page || 1,
      page_size: params?.page_size || 10
    }
  };

  return blogAxios.get(createBlogApiUrl('dynamics/'), { params })
    .then(response => {
      console.log('[Blog API] 获取动态列表响应:', response);
      return response;
    })
    .catch(error => {
      console.error('[Blog API] 获取动态列表失败:', error);
      console.log('[Blog API] 使用模拟数据');
      return mockData;
    });
}

/**
 * 获取博客动态详情
 * @param {string} id 动态ID
 * @returns {Promise} 动态详情
 */
export function getBlogDynamicDetail(id) {
  return blogAxios.get(createBlogApiUrl(`dynamics/${id}/`))
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
  return blogAxios.get(createBlogApiUrl(`dynamics/${id}/adjacent`))
    .catch(error => {
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
  return blogAxios.get(createBlogApiUrl('dynamics/hot'), { params })
    .catch(error => {
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
  return blogAxios.get(createBlogApiUrl('dynamics/recent'), { params })
    .catch(error => {
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
  return blogAxios.get(createBlogApiUrl(`categories/${categoryId}/dynamics/`), { params })
    .catch(error => {
      console.error('获取分类下的博客动态失败:', error)
      throw error
    })
}

/**
 * 搜索博客动态
 * @param {Object} params 搜索参数
 * @param {string} params.keyword 搜索关键词
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.type 动态类型（可选）
 * @param {string} params.sortBy 排序方式（可选）
 * @returns {Promise} 搜索结果
 */
export function searchBlogDynamics(params) {
  console.log('[Blog API] 搜索动态, 参数:', params);
  console.log('[Blog API] 搜索URL:', createBlogApiUrl('dynamics/search'));
  
  return blogAxios.get(createBlogApiUrl('dynamics/search'), { params })
    .then(response => {
      console.log('[Blog API] 搜索响应:', response);
      
      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 标准格式 {code: 200, data: {...}}
        if (response.code === 200 && response.data) {
          console.log('[Blog API] 返回标准响应格式');
          return response;
        }
        
        // 直接返回数据对象
        if (response.list || Array.isArray(response)) {
          console.log('[Blog API] 返回直接数据格式');
          return response;
        }
      }
      
      console.log('[Blog API] 无法识别的响应格式, 原样返回');
      return response;
    })
    .catch(error => {
      console.error('[Blog API] 搜索动态失败:', error);
      throw error;
    });
}

/**
 * 获取标签下的博客动态
 * @param {string} tagId 标签ID
 * @param {Object} params 分页参数
 * @returns {Promise} 动态列表
 */
export function getTagDynamics(tagId, params) {
  return blogAxios.get(createBlogApiUrl(`tags/${tagId}/dynamics`), { params })
    .catch(error => {
      console.error('获取标签下的博客动态失败:', error)
      throw error
    })
}

/**
 * 获取标签列表
 * @returns {Promise} 标签列表
 */
export function getBlogTagList() {
  return blogAxios.get(createBlogApiUrl('tags'))
    .catch(error => {
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
  console.log('[Blog API] 点赞动态, ID:', id);
  return blogAxios.post(createBlogApiUrl(`dynamics/${id}/like`))
    .then(response => {
      console.log('[Blog API] 点赞响应:', response);
      return response;
    })
    .catch(error => {
      console.error('[Blog API] 点赞失败:', error);
      throw error;
    });
}

/**
 * 评论博客动态
 * @param {string} id 动态ID
 * @param {Object} data 评论内容
 * @returns {Promise} 评论结果
 */
export function commentDynamic(id, data) {
  console.log('[Blog API] 发表评论, ID:', id, '数据:', data);
  return blogAxios.post(createBlogApiUrl(`dynamics/${id}/comments`), data)
    .then(response => {
      console.log('[Blog API] 评论响应:', response);
      return response;
    })
    .catch(error => {
      console.error('[Blog API] 评论失败:', error);
      throw error;
    });
}

/**
 * 获取博客动态评论
 * @param {string} id 动态ID
 * @param {Object} params 分页参数
 * @returns {Promise} 评论列表
 */
export function getDynamicComments(id, params) {
  console.log('[Blog API] 获取评论, ID:', id, '参数:', params);
  return blogAxios.get(createBlogApiUrl(`dynamics/${id}/comments`), { params })
    .then(response => {
      console.log('[Blog API] 获取评论响应:', response);
      
      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        if (response.code === 200 && response.data) {
          return response.data;
        }
        if (response.list || Array.isArray(response)) {
          return response;
        }
      }
      return response;
    })
    .catch(error => {
      console.error('[Blog API] 获取评论失败:', error);
      throw error;
    });
}

/**
 * 删除博客动态评论
 * @param {string} dynamicId 动态ID
 * @param {string} commentId 评论ID
 * @returns {Promise} 删除结果
 */
export function deleteDynamicComment(dynamicId, commentId) {
  return blogAxios.delete(createBlogApiUrl(`dynamics/${dynamicId}/comments/${commentId}`))
    .then(response => response.data)
    .catch(error => {
      console.error('删除评论失败:', error)
      throw error
    })
}

/**
 * 获取博客统计数据
 * @returns {Promise} 统计数据
 */
export function getBlogStats() {
  return blogAxios.get(createBlogApiUrl('stats'))
    .then(response => response.data)
    .catch(error => {
      console.error('获取博客统计数据失败:', error)
      throw error
    })
}

/**
 * 获取关于页面信息
 * @returns {Promise} 关于页面数据
 */
export function getAboutInfo() {
  console.log('[Blog API] 获取关于页面信息');
  return blogAxios.get(createBlogApiUrl('about/'))
    .then(response => {
      console.log('[Blog API] 获取关于页面信息响应:', response);
      
      // 处理不同的响应格式
      if (response && typeof response === 'object') {
        // 标准格式 {code: 200, data: {...}}
        if (response.code === 200 && response.data) {
          console.log('[Blog API] 返回标准响应格式');
          return response;
        }
        
        // 直接返回数据对象
        if (response.name || response.bio) {
          console.log('[Blog API] 返回直接数据格式');
          return {
            code: 200,
            message: 'success',
            data: response
          };
        }
      }
      
      console.log('[Blog API] 无法识别的响应格式, 原样返回');
      return response;
    })
    .catch(error => {
      console.error('[Blog API] 获取关于页面信息失败:', error);
      throw error;
    });
}

/**
 * 更新关于页面信息
 * @param {Object} data 关于页面数据
 * @returns {Promise} 更新结果
 */
export function updateAboutInfo(data) {
  return blogAxios.put(createBlogApiUrl('about'), data)
    .then(response => response.data)
    .catch(error => {
      console.error('更新关于页面信息失败:', error)
      throw error
    })
}