import { flushPromises, mount } from '@vue/test-utils'

import DynamicEdit from '../DynamicEdit.vue'
import { getFileList } from '@/api/file'

jest.mock('@/api/file', () => ({
  getFileList: jest.fn(),
  uploadFile: jest.fn(),
  searchFiles: jest.fn(),
  deleteFile: jest.fn(),
  downloadFile: jest.fn()
}))

jest.mock('@/api/dynamic', () => ({
  getDynamicDetail: jest.fn(),
  createDynamic: jest.fn(),
  updateDynamic: jest.fn()
}))

jest.mock('@/api/category', () => ({
  getCategoryList: jest.fn(),
  createCategory: jest.fn()
}))

jest.mock('@/api/tag', () => ({
  getTagList: jest.fn(),
  createTag: jest.fn()
}))

jest.mock('@/utils/upload', () => ({
  uploadImage: jest.fn(),
  uploadAudio: jest.fn(),
  uploadVideo: jest.fn(),
  checkFileSize: jest.fn(),
  checkFileType: jest.fn()
}))

jest.mock('@/components/MarkdownEditor.vue', () => ({
  __esModule: true,
  default: { template: '<div />' }
}))

jest.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: jest.fn() })
}))

const normalizedFiles = {
  count: 1,
  results: [{
    id: 7,
    name: 'cover.png',
    type: 'image',
    size: 0,
    url: '/media/cover.png'
  }]
}

describe('DynamicEdit file selector responses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getFileList.mockResolvedValue(normalizedFiles)
  })

  it('consumes normalized file results for open, search, and type-change fetches', async () => {
    const wrapper = mount(DynamicEdit, {
      global: {
        stubs: {
          'a-button': true,
          'a-form': true,
          'a-form-item': true,
          'a-input': true,
          'a-input-search': true,
          'a-list': true,
          'a-list-item': true,
          'a-modal': true,
          'a-radio': true,
          'a-radio-group': true,
          'a-select': true,
          'a-select-option': true,
          'a-spin': true,
          'a-upload': true
        },
        config: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('a-')
          }
        }
      }
    })
    await flushPromises()

    await wrapper.vm.showFileSelector()
    await flushPromises()
    expect(wrapper.vm.fileListData).toEqual(normalizedFiles.results)
    expect(wrapper.vm.fileTotal).toBe(normalizedFiles.count)

    await wrapper.vm.handleFileSearch('cover')
    await flushPromises()
    expect(wrapper.vm.fileListData).toEqual(normalizedFiles.results)
    expect(wrapper.vm.fileTotal).toBe(normalizedFiles.count)

    await wrapper.vm.handleFileTypeChange('image')
    await flushPromises()
    expect(wrapper.vm.fileListData).toEqual(normalizedFiles.results)
    expect(wrapper.vm.fileTotal).toBe(normalizedFiles.count)
    expect(getFileList).toHaveBeenCalledTimes(3)

    wrapper.unmount()
  })
})
