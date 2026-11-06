import { message } from 'ant-design-vue'

import { uploadFile as uploadFileRequest } from '@/api/file'
import { t } from '@/i18n'

export const uploadFile = (file, type, onProgress) => {
  if (!file || !(file instanceof File)) {
    throw new Error(t('upload.invalidFile'))
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
    message.error(t('upload.tooLarge', { size: readableSize }))
  }
  return isLtSize
}

export const checkFileType = (file, types) => {
  const extension = file.name.split('.').pop().toLowerCase()
  const isValid = types.includes(extension)
  if (!isValid) message.error(t('upload.invalidType', { types: types.join(', ') }))
  return isValid
}
