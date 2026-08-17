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
  uploadFile: jest.fn(),
  uploadImage: jest.fn(),
  uploadAudio: jest.fn(),
  uploadVideo: jest.fn(),
  checkFileSize: jest.fn(),
  checkFileType: jest.fn()
}))

const mockMarkdownInsert = jest.fn()
const mockMarkdownFocus = jest.fn()

jest.mock('@/components/MarkdownEditor.vue', () => ({
  __esModule: true,
  default: {
    template: '<div />',
    methods: {
      insertContent: (...args) => mockMarkdownInsert(...args),
      focus: (...args) => mockMarkdownFocus(...args)
    }
  }
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

  const mountEditor = () => mount(DynamicEdit, {
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
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }

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

  it('refreshes file data after confirming a file selection', async () => {
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
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }

    await wrapper.vm.showFileSelector()
    await flushPromises()
    wrapper.vm.handleFileSelect(wrapper.vm.fileListData[0])
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    wrapper.vm.handleFileConfirm()
    await flushPromises()

    expect(wrapper.vm.form.mediaUrls).toEqual(['/media/cover.png'])
    expect(wrapper.vm.form.fileIds).toEqual([7])
    expect(getFileList).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.fileListData).toEqual(normalizedFiles.results)
    wrapper.unmount()
  })

  it('keeps mixed selected files and derives the compatibility type', async () => {
    const wrapper = mountEditor()
    await flushPromises()
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    wrapper.vm.selectedFiles = [
      { id: 7, name: 'cover.png', type: 'image', url: '/media/cover.png' },
      { id: 8, name: 'voice.mp3', type: 'audio', url: '/media/voice.mp3' }
    ]

    wrapper.vm.handleFileConfirm()
    await flushPromises()

    expect(wrapper.vm.form.fileIds).toEqual([7, 8])
    expect(wrapper.vm.form.mediaUrls).toEqual(['/media/cover.png', '/media/voice.mp3'])
    expect(wrapper.vm.form.type).toBe('image')
    wrapper.unmount()
  })

  it('derives the compatibility type using the lowest file id', async () => {
    const wrapper = mountEditor()
    await flushPromises()
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    wrapper.vm.selectedFiles = [
      { id: 8, name: 'voice.mp3', type: 'audio', url: '/media/voice.mp3' },
      { id: 7, name: 'cover.png', type: 'image', url: '/media/cover.png' }
    ]

    wrapper.vm.handleFileConfirm()
    await flushPromises()

    expect(wrapper.vm.form.type).toBe('image')
    wrapper.unmount()
  })

  it('adds selected files without dropping existing attachments', async () => {
    const wrapper = mountEditor()
    await flushPromises()
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    wrapper.vm.form.mediaUrls = ['/media/cover.png']
    wrapper.vm.form.fileIds = [7]
    wrapper.vm.fileList = [{ id: 7, uid: '-7', name: 'cover.png', type: 'image', url: '/media/cover.png' }]
    wrapper.vm.selectedFiles = [{ id: 8, name: 'voice.mp3', type: 'audio', url: '/media/voice.mp3' }]

    wrapper.vm.handleFileConfirm()
    await flushPromises()

    expect(wrapper.vm.form.fileIds).toEqual([7, 8])
    expect(wrapper.vm.form.mediaUrls).toEqual(['/media/cover.png', '/media/voice.mp3'])
    wrapper.unmount()
  })

  it('inserts a selected image into Markdown and keeps the media association', async () => {
    const wrapper = mountEditor()
    await flushPromises()
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    wrapper.vm.markdownEditorRef = { insertContent: mockMarkdownInsert, focus: mockMarkdownFocus }
    wrapper.vm.selectedFiles = [{ id: 7, name: 'cover.png', type: 'image', url: '/media/cover.png' }]
    wrapper.vm.fileSelectorVisible = true

    wrapper.vm.handleFileInsert()
    await flushPromises()

    expect(mockMarkdownInsert).toHaveBeenCalledWith('![cover.png](/media/cover.png)')
    expect(mockMarkdownFocus).toHaveBeenCalled()
    expect(wrapper.vm.form.mediaUrls).toEqual(['/media/cover.png'])
    expect(wrapper.vm.form.fileIds).toEqual([7])
    expect(wrapper.vm.fileSelectorVisible).toBe(false)
    expect(wrapper.vm.selectedFiles).toEqual([])
    wrapper.unmount()
  })

  it('generates playable HTML for audio and video and preserves image order', async () => {
    const wrapper = mountEditor()
    await flushPromises()
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    wrapper.vm.markdownEditorRef = { insertContent: mockMarkdownInsert, focus: mockMarkdownFocus }

    wrapper.vm.selectedFiles = [{ id: 8, name: 'voice.mp3', type: 'audio', url: '/media/voice.mp3' }]
    wrapper.vm.handleFileInsert()
    expect(mockMarkdownInsert).toHaveBeenLastCalledWith('<audio controls src="/media/voice.mp3"></audio>')

    wrapper.vm.selectedFiles = [{ id: 9, name: 'demo.mp4', type: 'video', url: '/media/demo.mp4' }]
    wrapper.vm.handleFileInsert()
    expect(mockMarkdownInsert).toHaveBeenLastCalledWith('<video controls src="/media/demo.mp4"></video>')

    wrapper.vm.selectedFiles = [
      { id: 10, name: 'first.png', type: 'image', url: '/media/first.png' },
      { id: 11, name: 'second.png', type: 'image', url: '/media/second.png' }
    ]
    wrapper.vm.handleFileInsert()
    expect(mockMarkdownInsert).toHaveBeenLastCalledWith([
      '![first.png](/media/first.png)',
      '![second.png](/media/second.png)'
    ].join('\n\n'))
    wrapper.unmount()
  })

  it('keeps Markdown unchanged when only associating selected media', async () => {
    const wrapper = mountEditor()
    await flushPromises()
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    wrapper.vm.form.content = '原有正文'
    wrapper.vm.markdownEditorRef = { insertContent: mockMarkdownInsert, focus: mockMarkdownFocus }
    wrapper.vm.selectedFiles = [{ id: 7, name: 'cover.png', type: 'image', url: '/media/cover.png' }]

    wrapper.vm.handleFileConfirm()
    await flushPromises()

    expect(wrapper.vm.form.content).toBe('原有正文')
    expect(mockMarkdownInsert).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
