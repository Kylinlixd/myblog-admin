import { message } from 'ant-design-vue'
import axios from 'axios'
import request from './request'

/**
 * 上传文件
 * @param {File} file - 文件对象
 * @param {string} type - 文件类型（image/audio/video）
 * @returns {Promise<Object>} 上传结果
 */
export const uploadFile = async (file, type) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await request.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '上传失败')
  } catch (error) {
    message.error(error.message || '上传失败')
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