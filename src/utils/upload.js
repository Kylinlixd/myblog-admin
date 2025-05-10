import { message } from 'ant-design-vue'
import axios from 'axios'

// 创建一个专门用于文件上传的axios实例
const uploadAxios = axios.create({
  baseURL: '',
  timeout: 30000, // 文件上传需要更长的超时时间
  withCredentials: true
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

    // 使用专门的上传实例，不设置Content-Type
    const response = await uploadAxios.post('/api/upload/', formData, {
      headers: {
        'Authorization': token
      },
      // 确保不进行任何数据转换
      transformRequest: [(data) => data]
    })

    if (response.data.code === 200) {
      return response.data.data
    }
    throw new Error(response.data.message || '上传失败')
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