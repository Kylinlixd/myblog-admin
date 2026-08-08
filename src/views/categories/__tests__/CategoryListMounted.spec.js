import { flushPromises, mount } from '@vue/test-utils'

import CategoryList from '../CategoryList.vue'
import { createCategory, deleteCategory, getCategoryList, updateCategory } from '@/api/category'

jest.mock('@/api/category', () => ({
  getCategoryList: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn()
}))

jest.mock('ant-design-vue', () => ({
  ComponentStub: { template: '<div><slot /></div>' },
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  },
  Popconfirm: { template: '<div><slot /></div>' },
  Modal: { template: '<div><slot /></div>' },
  Form: { template: '<div><slot /></div>' },
  Input: { template: '<div><slot /></div>' },
  Textarea: { template: '<div><slot /></div>' },
  Select: { template: '<div><slot /></div>' }
}))

jest.mock('@ant-design/icons-vue', () => {
  const Icon = { template: '<span />' }
  return {
    PlusOutlined: Icon,
    EditOutlined: Icon,
    DeleteOutlined: Icon,
    SearchOutlined: Icon,
    ReloadOutlined: Icon
  }
})

const ButtonStub = {
  inheritAttrs: false,
  props: { loading: Boolean, disabled: Boolean },
  template: '<button v-bind="$attrs" :disabled="disabled" :data-loading="loading ? \'true\' : undefined"><slot /></button>'
}

const globalStubs = {
  PageHeader: true,
  'a-button': ButtonStub,
  'a-card': true,
  'a-form': true,
  'a-form-item': true,
  'a-input': true,
  'a-textarea': true,
  'a-select': true,
  'a-select-option': true,
  'a-space': true,
  'a-table': true,
  'a-tag': true,
  'a-popconfirm': true,
  'a-modal': true
}

const emptyResponse = { count: 0, results: [] }

describe('CategoryList mounted states and taxonomy actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getCategoryList.mockResolvedValue(emptyResponse)
    createCategory.mockResolvedValue({ id: 7, name: 'Frontend' })
    updateCategory.mockResolvedValue({ id: 7, name: 'Frontend Updated' })
    deleteCategory.mockResolvedValue({})
  })

  it('renders an empty state with a retry action after a successful empty load', async () => {
    const wrapper = mount(CategoryList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="category-async-state"]').text()).toContain('暂无分类')
    expect(wrapper.find('.state-retry').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders an inline error state and retries the category request', async () => {
    getCategoryList.mockRejectedValueOnce(new Error('分类加载失败'))
    const wrapper = mount(CategoryList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="category-async-state"]').text()).toContain('分类加载失败')
    getCategoryList.mockResolvedValueOnce(emptyResponse)
    await wrapper.find('.state-retry').trigger('click')
    await flushPromises()

    expect(getCategoryList).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="category-async-state"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('creates, edits, and deletes a category through normalized APIs', async () => {
    const wrapper = mount(CategoryList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.formRef = null

    wrapper.vm.handleAdd()
    wrapper.vm.categoryForm.name = 'Frontend'
    await wrapper.vm.handleSubmit()
    expect(createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Frontend' }))

    wrapper.vm.handleEdit({ id: 7, name: 'Frontend', description: '', status: 'active' })
    wrapper.vm.categoryForm.name = 'Frontend Updated'
    await wrapper.vm.handleSubmit()
    expect(updateCategory).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Frontend Updated' }))

    await wrapper.vm.handleDelete({ id: 7 })
    expect(deleteCategory).toHaveBeenCalledWith(7)
    wrapper.unmount()
  })
})
