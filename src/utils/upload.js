import { message } from 'ant-design-vue'
import axios from 'axios'

// 创建一个完全独立的axios实例，不使用任何全局配置
const uploadAxios = axios.create({
  baseURL: 'http://localhost:8000',  // 修改为正确的后端地址
  timeout: 30000,
  withCredentials: true,
  // 禁用所有默认转换
  transformRequest: [(data) => data],
  transformResponse: [(data) => data],
  // 不设置任何默认headers
  headers: {}
})

/**
 * 上传文件
 * @param {File} file - 文件对象
 * @param {string} type - 文件类型（image/audio/video）
 * @returns {Promise<Object>} 上传结果
 */
export const uploadFile = async (file, type) => {
  try {
    if (!file || !(file instanceof File)) {
      throw new Error('无效的文件对象')
    }

    // 创建FormData对象
    const formData = new FormData()
    // 直接添加文件对象，不进行任何转换
    formData.append('file', file)
    formData.append('file_type', type)

    // 获取认证令牌
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      throw new Error('未登录，请先登录')
    }

    // 确保令牌格式正确
    const token = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`

    console.log('开始上传文件:', {
      fileName: file.name,
      fileType: type,
      fileSize: file.size
    })

    // 使用专门的上传实例
    const response = await uploadAxios({
      method: 'post',
      url: '/api/upload/upload/',
      data: formData,
      headers: {
        'Authorization': token,
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('上传响应:', response)

    // 检查响应数据
    if (response.data) {
      // 如果响应是字符串，尝试解析JSON
      const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      console.log('处理后的响应数据:', responseData)
      
      if (responseData.code === 200 && responseData.data) {
        message.success(responseData.message || '上传成功')
        // 确保返回的数据包含url字段
        const result = responseData.data
        if (result) {
          // 确保 file_url 存在
          if (!result.file_url) {
            console.error('服务器返回的数据缺少 file_url:', result)
            throw new Error('服务器返回的数据格式不正确')
          }
          
          // 添加 url 字段以兼容前端
          result.url = result.file_url
          
          // 确保 URL 包含前缀
          if (!result.file_url.startsWith('http')) {
            result.file_url = `http://localhost:8000${result.file_url}`
            result.url = result.file_url
          }
          
          console.log('处理后的文件数据:', result)
        }
        return responseData // 返回完整的响应数据
      }
      
      // 如果响应不成功，抛出错误
      throw new Error(responseData.message || '上传失败')
    }
    
    throw new Error('服务器响应无效')
  } catch (error) {
    console.error('Upload error:', error)
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录')
      // 可以在这里添加重定向到登录页的逻辑
    } else if (error.response?.status === 500) {
      message.error('服务器错误，请稍后重试')
    } else {
      message.error(error.message || '上传失败')
    }
    throw error
  }
}

/**
 * 上传图片
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} 上传结果
 */
export const uploadImage = async (file) => {
  return uploadFile(file, 'image')
}

/**
 * 上传音频
 * @param {File} file - 音频文件
 * @returns {Promise<Object>} 上传结果
 */
export const uploadAudio = async (file) => {
  return uploadFile(file, 'audio')
}

/**
 * 上传视频
 * @param {File} file - 视频文件
 * @returns {Promise<Object>} 上传结果
 */
export const uploadVideo = async (file) => {
  return uploadFile(file, 'video')
}

/**
 * 检查文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大大小（MB）
 * @returns {boolean} 是否通过检查
 */
export const checkFileSize = (file, maxSize) => {
  const isLtSize = file.size / 1024 / 1024 < maxSize
  if (!isLtSize) {
    message.error(`文件大小不能超过 ${maxSize}MB!`)
  }
  return isLtSize
}

/**
 * 检查文件类型
 * @param {File} file - 文件对象
 * @param {Array<string>} types - 允许的文件类型
 * @returns {boolean} 是否通过检查
 */
export const checkFileType = (file, types) => {
  const extension = file.name.split('.').pop().toLowerCase()
  const isValid = types.includes(extension)
  if (!isValid) {
    message.error(`只能上传 ${types.join(', ')} 格式的文件!`)
  }
  return isValid
} 