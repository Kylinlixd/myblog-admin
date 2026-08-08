import { flushPromises, mount } from '@vue/test-utils'

import DynamicEdit from '../DynamicEdit.vue'
import { getDynamicDetail, createDynamic, updateDynamic } from '@/api/dynamic'
import { createCategory, getCategoryList } from '@/api/category'
import { createTag, getTagList } from '@/api/tag'
import { uploadImage } from '@/utils/upload'
import { message } from 'ant-design-vue'
import { loadEditorDraft } from '../editorDraft'

const routeParams = {}
const mockRouterPush = jest.fn()

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

jest.mock('@/api/file', () => ({
  getFileList: jest.fn(),
  uploadFile: jest.fn(),
  searchFiles: jest.fn(),
  deleteFile: jest.fn(),
  downloadFile: jest.fn()
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
  useRoute: () => ({ params: routeParams }),
  useRouter: () => ({ push: mockRouterPush })
}))

jest.mock('ant-design-vue', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  },
  Modal: { confirm: jest.fn() }
}))

jest.mock('@ant-design/icons-vue', () => {
  const Icon = { template: '<span />' }
  return {
    EyeOutlined: Icon,
    CheckOutlined: Icon,
    CloseOutlined: Icon,
    PlusOutlined: Icon,
    UploadOutlined: Icon,
    DeleteOutlined: Icon,
    FolderOutlined: Icon,
    FileOutlined: Icon
  }
})

const globalStubs = {
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
}

const mountEditor = async () => {
  const wrapper = mount(DynamicEdit, { global: { stubs: globalStubs } })
  wrapper.vm.formRef = {
    resetFields: jest.fn(),
    validateFields: jest.fn().mockResolvedValue()
  }
  await flushPromises()
  return wrapper
}

describe('DynamicEdit normalized API responses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    delete routeParams.id
    getDynamicDetail.mockResolvedValue({
      title: 'Existing title',
      type: 'text',
      content: 'Existing body',
      status: 'draft',
      mediaUrls: [],
      fileIds: [],
      tags: []
    })
    getCategoryList.mockResolvedValue({ count: 0, results: [] })
    getTagList.mockResolvedValue({ count: 0, results: [] })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('uses a normalized detail result to populate the form', async () => {
    routeParams.id = '42'
    getDynamicDetail.mockResolvedValueOnce({
      title: 'Normalized title',
      type: 'image',
      content: 'Normalized body',
      status: 'published',
      mediaUrls: ['/media/cover.png'],
      fileIds: [7],
      category: { id: 3 },
      tags: [{ id: 5 }]
    })

    const wrapper = await mountEditor()

    expect(wrapper.vm.form).toEqual({
      title: 'Normalized title',
      type: 'image',
      content: 'Normalized body',
      status: 'published',
      mediaUrls: ['/media/cover.png'],
      fileIds: [7],
      categoryId: 3,
      tags: [5]
    })
    expect(wrapper.vm.fileList[0]).toMatchObject({
      name: 'cover.png',
      url: '/media/cover.png',
      status: 'done'
    })
    wrapper.unmount()
  })

  it('resets the hydration guard after a detail request fails', async () => {
    routeParams.id = '42'
    let rejectDetail
    getDynamicDetail.mockReturnValueOnce(new Promise((resolve, reject) => {
      rejectDetail = reject
    }))

    const wrapper = mount(DynamicEdit, { global: { stubs: globalStubs } })
    await Promise.resolve()
    expect(wrapper.vm.isHydrating).toBe(true)

    rejectDetail(new Error('network unavailable'))
    await flushPromises()

    expect(wrapper.vm.isHydrating).toBe(false)
    wrapper.unmount()
  })

  it('does not mark initial detail hydration dirty or autosave it', async () => {
    routeParams.id = '42'
    jest.useFakeTimers()

    const wrapper = await mountEditor()
    jest.advanceTimersByTime(700)

    expect(wrapper.vm.dirty).toBe(false)
    expect(loadEditorDraft('42')).toBeNull()
    wrapper.unmount()
  })

  it('consumes normalized taxonomy collection results directly', async () => {
    getCategoryList.mockResolvedValueOnce({
      count: 1,
      results: [{ id: 3, name: 'Frontend' }]
    })
    getTagList.mockResolvedValueOnce({
      count: 1,
      results: [{ id: 5, name: 'Vue' }]
    })

    const wrapper = await mountEditor()

    expect(wrapper.vm.categories).toEqual([{ id: 3, name: 'Frontend' }])
    expect(wrapper.vm.tags).toEqual([{ id: 5, name: 'Vue' }])
    wrapper.unmount()
  })

  it.each([
    ['category', createCategory, { id: 9, name: 'New category' }],
    ['tag', createTag, { id: 11, name: 'New tag' }]
  ])('uses the normalized created %s item directly', async (type, create, created) => {
    create.mockResolvedValueOnce(created)
    const wrapper = await mountEditor()
    wrapper.vm.taxonomyModalType = type
    wrapper.vm.taxonomyName = created.name

    await wrapper.vm.createTaxonomy()
    await flushPromises()

    if (type === 'category') {
      expect(wrapper.vm.form.categoryId).toBe(created.id)
    } else {
      expect(wrapper.vm.form.tags).toContain(created.id)
    }
    wrapper.unmount()
  })

  it.each([
    ['create', undefined, createDynamic, '动态创建成功'],
    ['update', '42', updateDynamic, '动态更新成功']
  ])('treats a resolved %s request as success', async (operation, id, request, successMessage) => {
    if (id) routeParams.id = id
    request.mockResolvedValueOnce({ id: 42 })
    const wrapper = await mountEditor()
    wrapper.vm.formRef = {
      validate: jest.fn().mockResolvedValue(),
      validateFields: jest.fn().mockResolvedValue()
    }
    wrapper.vm.form.title = 'Saved title'
    wrapper.vm.form.content = 'Saved body'

    await wrapper.vm.handleSave()
    await flushPromises()

    expect(request).toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/dynamics')
    expect(message.success).toHaveBeenCalledWith(successMessage)
    expect(message.error).not.toHaveBeenCalled()
    expect(wrapper.vm.saving).toBe(false)
    wrapper.unmount()
  })

  it('uses normalized upload fields for media and file info', async () => {
    uploadImage.mockResolvedValueOnce({
      id: 19,
      name: 'photo.png',
      type: 'image',
      size: 128,
      url: '/media/photo.png'
    })
    const wrapper = await mountEditor()
    wrapper.vm.form.type = 'image'
    wrapper.vm.formRef = { validateFields: jest.fn().mockResolvedValue() }
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    const onSuccess = jest.fn()
    const onError = jest.fn()

    await wrapper.vm.handleCustomUpload({ file, onSuccess, onError })
    await flushPromises()

    expect(wrapper.vm.form.mediaUrls).toEqual(['/media/photo.png'])
    expect(wrapper.vm.form.fileIds).toEqual([19])
    expect(wrapper.vm.fileList[0]).toMatchObject({
      uid: file.uid,
      name: 'photo.png',
      type: 'image',
      id: 19,
      url: '/media/photo.png'
    })
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 19 }))
    expect(onError).not.toHaveBeenCalled()
    expect(message.success).toHaveBeenCalledWith('上传成功')
    wrapper.unmount()
  })
})
