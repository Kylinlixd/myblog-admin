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

const ButtonStub = { template: '<button v-bind="$attrs"><slot /></button>' }
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
  'a-space': true,
  'a-table': TableStub,
  'a-tag': true,
  'a-upload': true,
  'a-image': true,
  'a-popconfirm': true,
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
})
