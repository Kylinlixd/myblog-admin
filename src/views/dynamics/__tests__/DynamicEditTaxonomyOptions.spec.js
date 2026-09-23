import { flushPromises, mount } from '@vue/test-utils'

import DynamicEdit from '../DynamicEdit.vue'
import { getTagList, createTag } from '@/api/tag'
import { getCategoryList } from '@/api/category'

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

const tagPage = (page) => (page === 1
  ? { count: 12, results: Array.from({ length: 10 }, (_, index) => ({ id: index + 1, name: `标签${index + 1}` })) }
  : page === 2
    ? { count: 12, results: [{ id: 11, name: '第十一个' }, { id: 12, name: '第十二个' }] }
    : { count: 12, results: [] })

const mountEditor = async () => {
  const wrapper = mount(DynamicEdit, { global: { stubs: globalStubs } })
  await flushPromises()
  wrapper.vm.formRef = { validate: jest.fn(), validateFields: jest.fn().mockResolvedValue() }
  return wrapper
}

describe('DynamicEdit taxonomy options', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    getCategoryList.mockResolvedValue({ count: 14, results: [{ id: 1, name: '技术笔记' }] })
    getTagList.mockImplementation(async ({ page } = {}) => tagPage(page || 1))
  })

  it('loads every tag page so the dropdown is not limited to the first 10', async () => {
    const wrapper = await mountEditor()

    expect(wrapper.vm.tags).toHaveLength(12)
    expect(wrapper.vm.tags[11]).toEqual({ id: 12, name: '第十二个' })
    expect(getTagList).toHaveBeenCalledWith({ page: 1 })
    expect(getTagList).toHaveBeenCalledWith({ page: 2 })
    wrapper.unmount()
  })

  it('loads every category page as well', async () => {
    getCategoryList.mockImplementation(async ({ page } = {}) => (page === 1
      ? { count: 12, results: Array.from({ length: 10 }, (_, index) => ({ id: index + 1, name: `分类${index + 1}` })) }
      : page === 2
        ? { count: 12, results: [{ id: 11, name: '第十一个分类' }, { id: 12, name: '第十二个分类' }] }
        : { count: 12, results: [] }))

    const wrapper = await mountEditor()

    expect(wrapper.vm.categories).toHaveLength(12)
    expect(getCategoryList).toHaveBeenCalledWith({ page: 2 })
    wrapper.unmount()
  })

  it('offers a create option for a typed tag name and selects the created id', async () => {
    createTag.mockResolvedValueOnce({ id: 99, name: '手工输入的标签' })
    const wrapper = await mountEditor()

    wrapper.vm.handleTagSearch('手工输入的标签')
    await flushPromises()

    const options = wrapper.vm.tagSelectOptions
    const createOption = options.find((option) => String(option.label).includes('手工输入的标签'))
    expect(createOption.label).toBe('新建标签「手工输入的标签」')

    wrapper.vm.handleTagsChange([createOption.value])
    await flushPromises()

    expect(createTag).toHaveBeenCalledWith({ name: '手工输入的标签' })
    expect(wrapper.vm.form.tags).toEqual([99])
    expect(wrapper.vm.tags).toEqual(expect.arrayContaining([{ id: 99, name: '手工输入的标签' }]))
    wrapper.unmount()
  })

  it('never keeps the placeholder value inside form.tags', async () => {
    createTag.mockResolvedValueOnce({ id: 100, name: '新标签' })
    const wrapper = await mountEditor()

    wrapper.vm.handleTagSearch('新标签')
    wrapper.vm.handleTagsChange([3, wrapper.vm.NEW_TAG_SENTINEL ?? '__create-tag__'])
    await flushPromises()

    expect(wrapper.vm.form.tags.every((value) => typeof value === 'number')).toBe(true)
    expect(wrapper.vm.form.tags).toContain(3)
    wrapper.unmount()
  })

  it('reuses an existing tag when creation collides', async () => {
    createTag.mockRejectedValueOnce(new Error('标签已存在'))
    const wrapper = await mountEditor()

    wrapper.vm.handleTagSearch('标签1')
    wrapper.vm.handleTagsChange(['__create-tag__'])
    await flushPromises()

    expect(wrapper.vm.form.tags).toEqual([1])
    wrapper.unmount()
  })

  it('offers a create option for a typed category name and opens the dialog', async () => {
    const wrapper = await mountEditor()

    wrapper.vm.handleCategorySearch('全新分类')
    await flushPromises()

    const createOption = wrapper.vm.categorySelectOptions
      .find((option) => String(option.label).includes('全新分类'))
    expect(createOption.label).toBe('新建分类「全新分类」')

    wrapper.vm.handleCategoryChange(createOption.value)
    await flushPromises()

    expect(wrapper.vm.taxonomyModalType).toBe('category')
    expect(wrapper.vm.taxonomyName).toBe('全新分类')
    expect(wrapper.vm.taxonomyModalVisible).toBe(true)
    expect(wrapper.vm.form.categoryId).toBeUndefined()
    wrapper.unmount()
  })

  it('keeps an existing category value untouched when it is re-selected', async () => {
    const wrapper = await mountEditor()

    wrapper.vm.handleCategoryChange(1)

    expect(wrapper.vm.taxonomyModalVisible).toBe(false)
    wrapper.unmount()
  })

  it('prefills the create dialog with the typed tag name', async () => {
    const wrapper = await mountEditor()

    wrapper.vm.handleTagSearch('  新标签  ')
    wrapper.vm.openTaxonomyModal('tag')

    expect(wrapper.vm.taxonomyName).toBe('新标签')
    wrapper.unmount()
  })
})
