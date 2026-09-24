import fs from 'node:fs'
import path from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'

import DynamicEdit from '../DynamicEdit.vue'

jest.mock('@/api/file', () => ({ getFileList: jest.fn() }))
jest.mock('@/api/dynamic', () => ({
  getDynamicDetail: jest.fn(),
  createDynamic: jest.fn(),
  updateDynamic: jest.fn()
}))
jest.mock('@/api/category', () => ({ getCategoryList: jest.fn(), createCategory: jest.fn() }))
jest.mock('@/api/tag', () => ({ getTagList: jest.fn(), createTag: jest.fn() }))
jest.mock('@/utils/upload', () => ({
  uploadFile: jest.fn(),
  uploadImage: jest.fn(),
  checkFileSize: jest.fn(() => true)
}))
jest.mock('@/components/MarkdownEditor.vue', () => ({ __esModule: true, default: { template: '<div />' } }))
jest.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: jest.fn() })
}))

const globalStubs = {
  'a-button': { template: '<button v-bind="$attrs"><slot /></button>' },
  'a-form': { template: '<form><slot /></form>' },
  'a-form-item': { template: '<div><slot /></div>' },
  'a-input': { template: '<input />' },
  'a-input-search': { template: '<input />' },
  'a-list': { template: '<div><slot /></div>' },
  'a-list-item': { template: '<div><slot /></div>' },
  'a-modal': { template: '<div><slot /></div>' },
  'a-pagination': true,
  'a-radio': { template: '<span><slot /></span>' },
  'a-radio-group': { template: '<div><slot /></div>' },
  'a-select': { template: '<div><slot /></div>' },
  'a-select-option': { template: '<option><slot /></option>' },
  'a-spin': { template: '<div><slot /></div>' },
  'a-upload': { template: '<div><slot /></div>' }
}

const readEditorView = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/views/dynamics/DynamicEdit.vue'), 'utf8')

describe('DynamicEdit editor image upload integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  const mountEditor = async () => {
    const { getCategoryList } = await import('@/api/category')
    const { getTagList } = await import('@/api/tag')
    getCategoryList.mockResolvedValue({ count: 0, results: [] })
    getTagList.mockResolvedValue({ count: 0, results: [] })
    const wrapper = mount(DynamicEdit, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.formRef = { validate: jest.fn(), validateFields: jest.fn().mockResolvedValue() }
    return wrapper
  }

  it('registers editor-uploaded images as dynamic attachments', async () => {
    const wrapper = await mountEditor()

    wrapper.vm.handleEditorImageUploaded({
      id: 31,
      name: 'inline.png',
      url: '/api/files/public/inline/',
      type: 'image',
      size: 2048
    })
    await flushPromises()

    expect(wrapper.vm.form.mediaUrls).toEqual(['/api/files/public/inline/'])
    expect(wrapper.vm.form.fileIds).toEqual([31])
    expect(wrapper.vm.form.type).toBe('image')
    expect(wrapper.vm.fileList).toHaveLength(1)
    expect(wrapper.vm.fileList[0]).toMatchObject({ id: 31, name: 'inline.png', type: 'image' })
    wrapper.unmount()
  })

  it('ignores an empty upload result', async () => {
    const wrapper = await mountEditor()

    wrapper.vm.handleEditorImageUploaded({})
    await flushPromises()

    expect(wrapper.vm.form.mediaUrls).toEqual([])
    expect(wrapper.vm.fileList).toEqual([])
    wrapper.unmount()
  })

  it('keeps both attachment buttons on one row on narrow screens', () => {
    const source = readEditorView()
    const mobileStyles = source.slice(
      source.indexOf('@media (max-width: 640px)'),
      source.indexOf(':global([data-theme=')
    )
    const containerRule = mobileStyles.slice(
      mobileStyles.indexOf('.media-upload-container'),
      mobileStyles.indexOf('.media-upload-field')
    )

    expect(containerRule).toContain('flex-wrap: wrap')
    expect(containerRule).not.toContain('flex-direction: column')
    expect(source).not.toContain('style="margin-left: 8px"')
    expect(source).toContain('class="media-pick-button"')
  })
})
