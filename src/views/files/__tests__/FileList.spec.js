import { flushPromises, mount } from '@vue/test-utils'

import FileList from '../FileList.vue'
import { deleteFile, getFileList, getFileSummary, uploadFile } from '@/api/file'
import { message } from 'ant-design-vue'

jest.mock('@/api/file', () => ({
  uploadFile: jest.fn(),
  getFileList: jest.fn(),
  getFileSummary: jest.fn(),
  searchFiles: jest.fn(),
  deleteFile: jest.fn(),
  downloadFile: jest.fn()
}))

// 概况区数字来自后端聚合；默认返回空汇总，具体用例可按需覆盖。
beforeEach(() => {
  getFileSummary.mockResolvedValue({ total: 0, totalBytes: 0 })
})

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
    FileTextOutlined: Icon,
    PictureOutlined: Icon
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

describe('file list preview fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getFileSummary.mockResolvedValue({ total: 0, totalBytes: 0 })
  })

  it('marks an image as unavailable after a load error and stops re-rendering a-image', async () => {
    getFileList.mockResolvedValue(fileListResponse)
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()

    const record = wrapper.vm.fileList[0]
    expect(wrapper.vm.unavailableImageIds.has(record.id)).toBe(false)

    wrapper.vm.handleImageError({ target: { src: '' } }, record)
    await flushPromises()

    expect(wrapper.vm.unavailableImageIds.has(record.id)).toBe(true)
    expect(wrapper.vm.isImageUnavailable(record)).toBe(true)
    // 重复失败不会把集合撑大，也不会重复提示
    wrapper.vm.handleImageError({ target: { src: '' } }, record)
    expect(wrapper.vm.unavailableImageIds.size).toBe(1)
    wrapper.unmount()
  })

  it('reports a service problem instead of blaming the file when the preview fails', async () => {
    getFileList.mockResolvedValue(fileListResponse)
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()

    wrapper.vm.handlePreviewError(new Error('500'), wrapper.vm.fileList[0])

    expect(message.error).toHaveBeenCalledWith(expect.stringContaining('文件服务暂时不可用'))
    expect(message.error).not.toHaveBeenCalledWith(expect.stringContaining('请检查文件是否存在'))
    wrapper.unmount()
  })
})

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

    expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({
      file,
      file_type: 'image',
      onProgress: expect.any(Function),
      onProgressDetails: expect.any(Function)
    }))
    expect(onSuccess).toHaveBeenCalledWith(uploadResult)
    expect(onError).not.toHaveBeenCalled()
    expect(message.success).toHaveBeenCalledWith('上传成功')
    expect(getFileList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('recognizes document extensions and enforces the shared 1 GB limit', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.vm.inferFileType({ name: 'guide.pdf', type: 'application/pdf' })).toBe('document')
    expect(wrapper.vm.inferFileType({ name: 'checklist.docx', type: '' })).toBe('document')
    expect(wrapper.vm.beforeUpload({ name: 'large.pdf', size: 1024 * 1024 * 1024 + 1 })).toBe(false)
    expect(message.error).toHaveBeenCalledWith('文件大小不能超过 1 GB')
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

  it('keeps a processing state after transfer reaches 100 percent until the server confirms', async () => {
    let finishUpload
    uploadFile.mockImplementationOnce(({ onProgress, onProgressDetails }) => {
      onProgress(100)
      onProgressDetails({ loaded: 100, total: 100, lengthComputable: true })
      return new Promise((resolve) => { finishUpload = resolve })
    })
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()

    const uploadPromise = wrapper.vm.handleCustomUpload({
      file: { name: 'processing.mp4', type: 'video/mp4' },
      onSuccess: jest.fn(),
      onError: jest.fn()
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uploadStage).toBe('processing')
    expect(wrapper.vm.uploadProgress).toBe(100)
    expect(wrapper.vm.uploadingName).toBe('processing.mp4')

    finishUpload({ id: 19, name: 'processing.mp4' })
    await uploadPromise
    expect(wrapper.vm.uploadStage).toBe('success')
    expect(wrapper.vm.uploadingName).toBe('')
    wrapper.unmount()
  })
})
