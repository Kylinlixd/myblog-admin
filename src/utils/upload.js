import { message } from 'ant-design-vue'

import { uploadFile as uploadFileRequest } from '@/api/file'

export const uploadFile = (file, type) => {
  if (!file || !(file instanceof File)) {
    throw new Error('无效的文件对象')
  }

  return uploadFileRequest({ file, file_type: type })
}

export const uploadImage = (file) => uploadFile(file, 'image')
export const uploadAudio = (file) => uploadFile(file, 'audio')
export const uploadVideo = (file) => uploadFile(file, 'video')

export const checkFileSize = (file, maxSize) => {
  const isLtSize = file.size / 1024 / 1024 < maxSize
  if (!isLtSize) message.error(`文件大小不能超过 ${maxSize}MB!`)
  return isLtSize
}

export const checkFileType = (file, types) => {
  const extension = file.name.split('.').pop().toLowerCase()
  const isValid = types.includes(extension)
  if (!isValid) message.error(`只能上传 ${types.join(', ')} 格式的文件!`)
  return isValid
}
