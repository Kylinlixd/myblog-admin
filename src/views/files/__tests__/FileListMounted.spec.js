import { flushPromises, mount } from '@vue/test-utils'

import FileList from '../FileList.vue'
import { deleteFile, getFileList, searchFiles } from '@/api/file'

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

const ButtonStub = {
  inheritAttrs: false,
  props: { loading: Boolean, disabled: Boolean },
  template: '<button v-bind="$attrs" :disabled="disabled" :data-loading="loading ? \'true\' : undefined"><slot /></button>'
}
const TableStub = {
  props: { dataSource: { type: Array, default: () => [] } },
  template: '<div class="table-stub"><slot v-for="record in dataSource" name="bodyCell" :column="{ dataIndex: \'preview\' }" :record="record" /></div>'
}
const ModalStub = {
  props: { open: Boolean },
  template: '<div v-if="open" class="modal-stub"><slot /></div>'
}

const globalStubs = {
  PageHeader: true,
  'a-button': ButtonStub,
  'a-card': true,
  'a-form': true,
  'a-form-item': true,
  'a-input': true,
  'a-input-search': true,
  'a-select': true,
  'a-select-option': true,
  'a-space': { template: '<div><slot /></div>' },
  'a-table': TableStub,
  'a-tag': true,
  'a-upload': true,
  'a-image': true,
  'a-popconfirm': { template: '<div><slot /></div>' },
  'a-modal': ModalStub
}

const fileResponse = {
  count: 1,
  results: [{ id: 7, name: 'cover.png', type: 'image', size: 0, url: '/media/cover.png' }]
}

const deferred = () => {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

describe('FileList mounted states, batch behavior, and previews', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getFileList.mockResolvedValue(fileResponse)
    searchFiles.mockResolvedValue(fileResponse)
    deleteFile.mockResolvedValue({})
  })

  it('renders an inline empty or error state with retry', async () => {
    getFileList.mockResolvedValueOnce({ count: 0, results: [] })
    const emptyWrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(emptyWrapper.find('[data-testid="file-async-state"]').exists()).toBe(true)
    emptyWrapper.unmount()

    getFileList.mockRejectedValueOnce(new Error('文件加载失败'))
    const errorWrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(errorWrapper.find('[data-testid="file-async-state"]').text()).toContain('文件加载失败')
    errorWrapper.unmount()
  })

  it('retains failed ids after a partial batch delete', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.selectedRowKeys = [7, 8]
    deleteFile.mockImplementation((id) => id === 8 ? Promise.reject(new Error('failed')) : Promise.resolve({}))

    await wrapper.vm.handleBatchDelete()

    expect(wrapper.vm.selectedRowKeys).toEqual([8])
    wrapper.unmount()
  })

  it('keeps the media preview container at a stable ratio', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.previewMedia('video', '/media/video.mp4')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.media-preview-container').classes()).toContain('media-preview-container--stable')
    wrapper.unmount()
  })

  it('marks an individual delete as pending without blocking unrelated rows', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    const request = deferred()
    deleteFile.mockReturnValueOnce(request.promise)
    const promise = wrapper.vm.handleDelete(7)

    expect(wrapper.vm.deletingIds).toContain(7)
    request.resolve()
    await promise
    expect(wrapper.vm.deletingIds).not.toContain(7)
    wrapper.unmount()
  })

  it('guards the batch delete action while its requests are pending', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    const request = deferred()
    deleteFile.mockReturnValue(request.promise)
    wrapper.vm.selectedRowKeys = [7, 8]

    const firstBatch = wrapper.vm.handleBatchDelete()
    await wrapper.vm.$nextTick()

    const batchButton = wrapper.find('.admin-toolbar button')
    expect(wrapper.vm.batchDeleting).toBe(true)
    expect(batchButton.attributes('disabled')).toBeDefined()
    expect(batchButton.attributes('data-loading')).toBe('true')

    await wrapper.vm.handleBatchDelete()
    expect(deleteFile).toHaveBeenCalledTimes(2)

    request.resolve({})
    await firstBatch
    expect(wrapper.vm.batchDeleting).toBe(false)
    wrapper.unmount()
  })

  it('preserves active name and type filters while paginating and starts new searches on page one', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.searchForm.name = 'cover'
    wrapper.vm.searchForm.type = 'image'
    wrapper.vm.currentPage = 3

    wrapper.vm.paginationConfig.onChange(4, 20)
    await flushPromises()
    expect(searchFiles).toHaveBeenLastCalledWith({
      q: 'cover',
      type: 'image',
      page: 4,
      pageSize: 20
    })

    wrapper.vm.currentPage = 5
    wrapper.vm.handleSearch()
    await flushPromises()
    expect(wrapper.vm.currentPage).toBe(1)
    expect(searchFiles).toHaveBeenLastCalledWith({
      q: 'cover',
      type: 'image',
      page: 1,
      pageSize: 20
    })
    wrapper.unmount()
  })

  it('resets an empty out-of-range page once while keeping active filters', async () => {
    getFileList.mockResolvedValueOnce(fileResponse)
    searchFiles.mockResolvedValueOnce({ count: 0, results: [] })
      .mockResolvedValueOnce(fileResponse)
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.searchForm.name = 'cover'
    wrapper.vm.searchForm.type = 'image'
    wrapper.vm.currentPage = 2

    await wrapper.vm.fetchFiles()
    expect(wrapper.vm.currentPage).toBe(1)
    expect(searchFiles).toHaveBeenNthCalledWith(2, {
      q: 'cover', type: 'image', page: 1, pageSize: 10
    })
    expect(wrapper.vm.fileList).toHaveLength(1)
    wrapper.unmount()
  })

  it('uses one pagination request path when the table emits a pagination change', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    getFileList.mockClear()

    wrapper.vm.paginationConfig.onChange(2, 20)
    await flushPromises()

    expect(getFileList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('requests once when a page-size change emits both pagination callbacks', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    getFileList.mockClear()

    wrapper.vm.paginationConfig.onShowSizeChange(3, 20)
    wrapper.vm.paginationConfig.onChange(1, 20)
    await flushPromises()

    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.pageSize).toBe(20)
    expect(getFileList).toHaveBeenCalledTimes(1)
    expect(getFileList).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
    wrapper.unmount()
  })

  it('keeps the newest file response and loading state when requests finish out of order', async () => {
    const first = deferred()
    const second = deferred()
    getFileList.mockReset()
    getFileList.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    const newerRequest = wrapper.vm.fetchFiles()
    await wrapper.vm.$nextTick()

    second.resolve({ count: 1, results: [{ id: 2, name: 'new.png', type: 'image', size: 1, url: '/new.png' }] })
    await newerRequest
    first.resolve({ count: 1, results: [{ id: 1, name: 'old.png', type: 'image', size: 1, url: '/old.png' }] })
    await flushPromises()

    expect(wrapper.vm.fileList[0].id).toBe(2)
    expect(wrapper.vm.loading).toBe(false)
    wrapper.unmount()
  })

  it('does not let a batch delete repeat a row delete already in progress', async () => {
    const wrapper = mount(FileList, { global: { stubs: globalStubs } })
    await flushPromises()
    const rowRequest = deferred()
    const batchRequest = deferred()
    deleteFile.mockImplementation((id) => id === 7 ? rowRequest.promise : batchRequest.promise)

    const rowPromise = wrapper.vm.handleDelete(7)
    await wrapper.vm.$nextTick()
    wrapper.vm.selectedRowKeys = [7, 8]
    const batchPromise = wrapper.vm.handleBatchDelete()
    await wrapper.vm.$nextTick()

    expect(deleteFile).toHaveBeenCalledTimes(2)
    expect(deleteFile).toHaveBeenNthCalledWith(1, 7)
    expect(deleteFile).toHaveBeenNthCalledWith(2, 8)

    rowRequest.resolve({})
    batchRequest.resolve({})
    await Promise.all([rowPromise, batchPromise])
    wrapper.unmount()
  })
})
