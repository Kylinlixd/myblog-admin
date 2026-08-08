import { flushPromises, mount } from '@vue/test-utils'

import FileList from '../FileList.vue'
import { deleteFile, getFileList, uploadFile } from '@/api/file'
import { message } from 'ant-design-vue'

jest.mock('@/api/file', () => ({
  uploadFile: jest.fn(),
  getFileList: jest.fn(),
  searchFiles: jest.fn(),
  deleteFile: jest.fn(),
  downloadFile: jest.fn()
}))

jest.mock('ant-design-vue', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}))

jest.mock('@ant-design/icons-vue', () => {
  const Icon = { template: '<span />' }
  return {
    UploadOutlined: Icon,
    SearchOutlined: Icon,
    ReloadOutlined: Icon,
    DeleteOutlined: Icon,
    SoundOutlined: Icon,
    VideoCameraOutlined: Icon,
    CopyOutlined: Icon,
    DownloadOutlined: Icon,
    LoadingOutlined: Icon
  }
})

const fileListResponse = {
  count: 1,
  results: [{
    id: 7,
    name: 'cover.png',
    type: 'image',
    size: 0,
    url: '/media/cover.png'
  }]
}

const globalStubs = {
  PageHeader: true,
  'a-button': true,
  'a-card': true,
  'a-form': true,
  'a-form-item': true,
  'a-input': true,
  'a-input-search': true,
  'a-select': true,
  'a-select-option': true,
  'a-space': true,
  'a-table': true,
  'a-tag': true,
  'a-upload': true,
  'a-image': true,
  'a-popconfirm': true,
  'a-modal': true
}

describe('FileList delete handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getFileList.mockResolvedValue(fileListResponse)
  })

  it('accepts a normalized delete result and surfaces caught delete errors', async () => {
    deleteFile.mockResolvedValueOnce({ detail: 'deleted' })
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()

    await wrapper.vm.handleDelete(7)
    await flushPromises()

    expect(deleteFile).toHaveBeenCalledWith(7)
    expect(message.success).toHaveBeenCalledWith('删除成功')
    expect(message.error).not.toHaveBeenCalled()
    expect(getFileList).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.loading).toBe(false)

    deleteFile.mockRejectedValueOnce(new Error('删除权限不足'))
    await wrapper.vm.handleDelete(7)
    await flushPromises()

    expect(message.error).toHaveBeenCalledWith('删除权限不足')
    expect(wrapper.vm.loading).toBe(false)
    wrapper.unmount()
  })
})

describe('FileList upload handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getFileList.mockResolvedValue(fileListResponse)
  })

  it('accepts a resolved normalized upload result', async () => {
    const uploadResult = {
      id: 12,
      name: 'new-cover.png',
      file_type: 'image',
      file_url: '/media/new-cover.png'
    }
    uploadFile.mockResolvedValueOnce(uploadResult)
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()

    const file = { name: 'new-cover.png', type: 'image/png' }
    const onSuccess = jest.fn()
    const onError = jest.fn()

    await wrapper.vm.handleCustomUpload({ file, onSuccess, onError })
    await flushPromises()

    expect(uploadFile).toHaveBeenCalledWith({ file, file_type: 'image' })
    expect(onSuccess).toHaveBeenCalledWith(uploadResult)
    expect(onError).not.toHaveBeenCalled()
    expect(message.success).toHaveBeenCalledWith('上传成功')
    expect(getFileList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})
