import { flushPromises, mount } from '@vue/test-utils'

import DynamicEdit from '../DynamicEdit.vue'
import { createDynamic } from '@/api/dynamic'
import { createCategory, getCategoryList } from '@/api/category'
import { createTag, getTagList } from '@/api/tag'
import { getFileList } from '@/api/file'
import { loadEditorDraft } from '../editorDraft'

jest.mock('@/api/dynamic', () => ({
  getDynamicDetail: jest.fn(),
  createDynamic: jest.fn(),
  updateDynamic: jest.fn()
}))
jest.mock('@/api/category', () => ({ getCategoryList: jest.fn(), createCategory: jest.fn() }))
jest.mock('@/api/tag', () => ({ getTagList: jest.fn(), createTag: jest.fn() }))
jest.mock('@/api/file', () => ({ getFileList: jest.fn() }))
jest.mock('@/utils/upload', () => ({
  uploadImage: jest.fn(), uploadAudio: jest.fn(), uploadVideo: jest.fn(),
  checkFileSize: jest.fn(() => true), checkFileType: jest.fn(() => true)
}))
jest.mock('@/components/MarkdownEditor.vue', () => ({ __esModule: true, default: { template: '<div />' } }))

jest.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: jest.fn() })
}))

jest.mock('ant-design-vue', () => ({
  message: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
  Modal: { confirm: jest.fn() }
}))

jest.mock('@ant-design/icons-vue', () => {
  const Icon = { template: '<span />' }
  return {
    EyeOutlined: Icon, CheckOutlined: Icon, CloseOutlined: Icon, PlusOutlined: Icon,
    UploadOutlined: Icon, DeleteOutlined: Icon, FolderOutlined: Icon, FileOutlined: Icon
  }
})

const ButtonStub = {
  props: ['loading', 'disabled'],
  template: '<button :disabled="disabled" :data-loading="loading ? \'true\' : undefined" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>'
}

const globalStubs = {
  'a-button': ButtonStub,
  'a-form': { template: '<form><slot /></form>' },
  'a-form-item': { template: '<div><slot /></div>' },
  'a-input': { template: '<input />' },
  'a-input-search': { template: '<input />' },
  'a-list': { template: '<div><slot /></div>' },
  'a-list-item': { template: '<div><slot /></div>' },
  'a-modal': { template: '<div><slot /></div>' },
  'a-radio': { template: '<span><slot /></span>' },
  'a-radio-group': { template: '<div><slot /></div>' },
  'a-select': { props: ['options', 'loading', 'value'], template: '<div><slot /></div>' },
  'a-select-option': { template: '<option><slot /></option>' },
  'a-spin': { template: '<div><slot /></div>' },
  'a-upload': { template: '<div><slot /></div>' },
  'router-link': { template: '<a><slot /></a>' }
}

const mountEditor = async () => {
  getCategoryList.mockResolvedValue({ count: 0, results: [] })
  getTagList.mockResolvedValue({ count: 0, results: [] })
  getFileList.mockResolvedValue({ count: 0, results: [] })
  const wrapper = mount(DynamicEdit, { global: { stubs: globalStubs } })
  const formMock = { validate: jest.fn().mockResolvedValue(), validateFields: jest.fn().mockResolvedValue() }
  wrapper.vm.formRef = formMock
  await flushPromises()
  wrapper.vm.formRef = formMock
  return wrapper
}

describe('DynamicEdit mounted interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.clear()
    createDynamic.mockResolvedValue({ id: 8 })
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  it('retains title and content after a failed save and shows saving on both save buttons', async () => {
    let rejectSave
    createDynamic.mockReturnValueOnce(new Promise((resolve, reject) => { rejectSave = reject }))
    const wrapper = await mountEditor()
    wrapper.vm.form.title = 'Keep this title'
    wrapper.vm.form.content = 'Keep this content'

    const save = wrapper.vm.handleSave()
    await flushPromises()
    expect(wrapper.findAll('button[data-loading="true"]').length).toBe(2)
    rejectSave(new Error('保存失败'))
    await save
    expect(wrapper.vm.form.title).toBe('Keep this title')
    expect(wrapper.vm.form.content).toBe('Keep this content')
    wrapper.unmount()
  })

  it('keeps preview available but disabled when content is empty', async () => {
    const wrapper = await mountEditor()
    const preview = wrapper.find('button[aria-label="预览"]')
    expect(preview.exists()).toBe(true)
    expect(preview.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('clears incompatible media controls when the content type changes', async () => {
    const wrapper = await mountEditor()
    wrapper.vm.form.type = 'image'
    wrapper.vm.form.mediaUrls = ['/media/image.png']
    wrapper.vm.form.fileIds = [3]
    wrapper.vm.fileList = [{ uid: '3', type: 'image', url: '/media/image.png' }]
    wrapper.vm.form.type = 'audio'
    await flushPromises()

    expect(wrapper.vm.form.mediaUrls).toEqual([])
    expect(wrapper.vm.form.fileIds).toEqual([])
    expect(wrapper.vm.fileList).toEqual([])
    wrapper.unmount()
  })

  it('restores a stored draft and autosaves later edits', async () => {
    jest.useFakeTimers()
    localStorage.setItem('kylin:editor-draft:new', JSON.stringify({
      title: 'Recovered title',
      content: 'Recovered content',
      type: 'text',
      status: 'draft',
      mediaUrls: [],
      fileIds: [],
      tags: []
    }))

    const wrapper = await mountEditor()
    expect(wrapper.vm.form.title).toBe('Recovered title')
    expect(wrapper.vm.form.content).toBe('Recovered content')

    wrapper.vm.form.title = 'Autosaved title'
    await wrapper.vm.$nextTick()
    jest.advanceTimersByTime(700)
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(loadEditorDraft('new')).toMatchObject({
      title: 'Autosaved title',
      content: 'Recovered content'
    })
    wrapper.unmount()
    jest.useRealTimers()
  })

  it('clears the draft after a successful save', async () => {
    localStorage.setItem('kylin:editor-draft:new', JSON.stringify({ title: 'Old draft', content: 'Old body' }))
    const wrapper = await mountEditor()
    wrapper.vm.form.title = 'Saved title'
    wrapper.vm.form.content = 'Saved body'

    await wrapper.vm.handleSave()

    expect(createDynamic).toHaveBeenCalled()
    expect(loadEditorDraft('new')).toBeNull()
    wrapper.unmount()
  })

  it('refreshes categories and selects a newly created category', async () => {
    createCategory.mockResolvedValueOnce({ id: 9, name: 'Frontend' })
    getCategoryList
      .mockResolvedValueOnce({ count: 0, results: [] })
      .mockResolvedValueOnce({ count: 1, results: [{ id: 9, name: 'Frontend' }] })
    const wrapper = await mountEditor()
    wrapper.vm.taxonomyModalType = 'category'
    wrapper.vm.taxonomyName = 'Frontend'

    await wrapper.vm.createTaxonomy()
    await flushPromises()

    expect(getCategoryList).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.categories).toEqual([{ id: 9, name: 'Frontend' }])
    expect(wrapper.vm.form.categoryId).toBe(9)
    wrapper.unmount()
  })

  it('refreshes tags and selects a newly created tag', async () => {
    createTag.mockResolvedValueOnce({ id: 11, name: 'Vue' })
    getTagList
      .mockResolvedValueOnce({ count: 0, results: [] })
      .mockResolvedValueOnce({ count: 1, results: [{ id: 11, name: 'Vue' }] })
    const wrapper = await mountEditor()
    wrapper.vm.taxonomyModalType = 'tag'
    wrapper.vm.taxonomyName = 'Vue'

    await wrapper.vm.createTaxonomy()
    await flushPromises()

    expect(getTagList).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.tags).toEqual([{ id: 11, name: 'Vue' }])
    expect(wrapper.vm.form.tags).toContain(11)
    wrapper.unmount()
  })
})
