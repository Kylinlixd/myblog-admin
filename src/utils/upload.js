import { message } from 'ant-design-vue'

import { uploadFile as uploadFileRequest } from '@/api/file'

export const uploadFile = (file, type, onProgress) => {
  if (!file || !(file instanceof File)) {
    throw new Error('无效的文件对象')
  }

  return uploadFileRequest({ file, file_type: type, onProgress })
}

export const uploadImage = (file, onProgress) => uploadFile(file, 'image', onProgress)
export const uploadAudio = (file, onProgress) => uploadFile(file, 'audio', onProgress)
export const uploadVideo = (file, onProgress) => uploadFile(file, 'video', onProgress)

export const checkFileSize = (file, maxSize) => {
  const isLtSize = file.size / 1024 / 1024 < maxSize
  if (!isLtSize) {
    const readableSize = maxSize >= 1024 && maxSize % 1024 === 0
      ? `${maxSize / 1024} GB`
      : `${maxSize}MB`
    message.error(`文件大小不能超过 ${readableSize}!`)
  }
  return isLtSize
}

export const checkFileType = (file, types) => {
  const extension = file.name.split('.').pop().toLowerCase()
  const isValid = types.includes(extension)
  if (!isValid) message.error(`只能上传 ${types.join(', ')} 格式的文件!`)
  return isValid
}
