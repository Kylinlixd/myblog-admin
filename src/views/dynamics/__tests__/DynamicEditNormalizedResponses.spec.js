import { flushPromises, mount } from '@vue/test-utils'

import DynamicEdit from '../DynamicEdit.vue'
import { getDynamicDetail, createDynamic, updateDynamic } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'
import { getTagList } from '@/api/tag'
import { uploadImage } from '@/utils/upload'
import { message } from 'ant-design-vue'

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
      file_type: 'image',
      file_url: '/media/photo.png'
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
