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
    LoadingOutlined: Icon,
    QuestionCircleOutlined: Icon,
    CloudServerOutlined: Icon,
    FileTextOutlined: Icon
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
  'a-alert': true,
  'a-button': true,
  'a-card': true,
  'a-drawer': true,
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
  'a-upload-dragger': { template: '<div><slot /></div>' },
  'a-image': true,
  'a-popconfirm': true,
  'a-modal': true,
  'a-progress': true,
  FileTutorialDrawer: true
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

    expect(uploadFile).toHaveBeenCalledWith({
      file,
      file_type: 'image',
      onProgress: expect.any(Function)
    })
    expect(onSuccess).toHaveBeenCalledWith(uploadResult)
    expect(onError).not.toHaveBeenCalled()
    expect(message.success).toHaveBeenCalledWith('上传成功')
    expect(getFileList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('recognizes document extensions and enforces the shared 50 MB limit', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.vm.inferFileType({ name: 'guide.pdf', type: 'application/pdf' })).toBe('document')
    expect(wrapper.vm.inferFileType({ name: 'checklist.docx', type: '' })).toBe('document')
    expect(wrapper.vm.beforeUpload({ name: 'large.pdf', size: 51 * 1024 * 1024 })).toBe(false)
    expect(message.error).toHaveBeenCalledWith('文件大小不能超过 50 MB')
    wrapper.unmount()
  })

  it('shows live progress and exposes the tutorial drawer action', async () => {
    let finishUpload
    uploadFile.mockImplementationOnce(({ onProgress }) => {
      onProgress(42)
      return new Promise((resolve) => { finishUpload = resolve })
    })
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    const onSuccess = jest.fn()
    const onError = jest.fn()

    const uploadPromise = wrapper.vm.handleCustomUpload({
      file: { name: 'guide.pdf', type: 'application/pdf' },
      onSuccess,
      onError
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uploadProgress).toBe(42)
    expect(wrapper.vm.uploadingName).toBe('guide.pdf')
    wrapper.vm.openTutorial()
    expect(wrapper.vm.tutorialOpen).toBe(true)

    finishUpload({ id: 13, name: 'guide.pdf' })
    await uploadPromise
    expect(onSuccess).toHaveBeenCalled()
    expect(wrapper.vm.uploadingName).toBe('')
    wrapper.unmount()
  })
})
