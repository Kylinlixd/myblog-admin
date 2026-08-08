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
  'a-space': { template: '<div><slot /></div>' },
  'a-table': true,
  'a-tag': true,
  'a-popconfirm': { template: '<div><slot /></div>' },
  'a-modal': true
}

const emptyResponse = { count: 0, results: [] }

const deferred = () => {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

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

  it('guards the batch delete action while its requests are pending', async () => {
    const wrapper = mount(CategoryList, { global: { stubs: globalStubs } })
    await flushPromises()
    const request = deferred()
    deleteCategory.mockReturnValue(request.promise)
    wrapper.vm.selectedRowKeys = [7, 8]

    const firstBatch = wrapper.vm.handleBatchDelete()
    await wrapper.vm.$nextTick()

    const batchButton = wrapper.find('.admin-toolbar button')
    expect(wrapper.vm.batchDeleting).toBe(true)
    expect(batchButton.attributes('disabled')).toBeDefined()
    expect(batchButton.attributes('data-loading')).toBe('true')

    await wrapper.vm.handleBatchDelete()
    expect(deleteCategory).toHaveBeenCalledTimes(2)

    request.resolve({})
    await firstBatch
    expect(wrapper.vm.batchDeleting).toBe(false)
    wrapper.unmount()
  })

  it('sends the current page and page size and resets to page one for search and reset', async () => {
    const wrapper = mount(CategoryList, { global: { stubs: globalStubs } })
    await flushPromises()

    wrapper.vm.pagination.onChange(3, 20)
    await flushPromises()
    expect(getCategoryList).toHaveBeenLastCalledWith({
      page: 3,
      pageSize: 20,
      name: undefined,
      status: undefined
    })

    wrapper.vm.handleSearch()
    await flushPromises()
    expect(wrapper.vm.pagination.current).toBe(1)
    expect(getCategoryList).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      name: undefined,
      status: undefined
    })

    wrapper.vm.pagination.current = 4
    wrapper.vm.resetSearch()
    await flushPromises()
    expect(wrapper.vm.pagination.current).toBe(1)
    wrapper.unmount()
  })

  it('keeps a newer request loading and prevents an older response from committing', async () => {
    const first = deferred()
    const second = deferred()
    getCategoryList.mockReset()
    getCategoryList.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const wrapper = mount(CategoryList, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    const newerRequest = wrapper.vm.fetchCategories()
    await wrapper.vm.$nextTick()

    first.resolve({ count: 1, results: [{ id: 1, name: 'old' }] })
    await flushPromises()
    expect(wrapper.vm.loading).toBe(true)
    expect(wrapper.vm.categoryList).toEqual([])

    second.resolve({ count: 1, results: [{ id: 2, name: 'new' }] })
    await newerRequest
    expect(wrapper.vm.categoryList).toEqual([{ id: 2, name: 'new', status: 'inactive' }])
    expect(wrapper.vm.loading).toBe(false)
    wrapper.unmount()
  })

  it('does not let a batch delete repeat a row delete already in progress', async () => {
    const wrapper = mount(CategoryList, { global: { stubs: globalStubs } })
    await flushPromises()
    const rowRequest = deferred()
    const batchRequest = deferred()
    deleteCategory.mockImplementation((id) => id === 7 ? rowRequest.promise : batchRequest.promise)

    const rowPromise = wrapper.vm.handleDelete({ id: 7 })
    await wrapper.vm.$nextTick()
    wrapper.vm.selectedRowKeys = [7, 8]
    const batchPromise = wrapper.vm.handleBatchDelete()
    await wrapper.vm.$nextTick()

    expect(deleteCategory).toHaveBeenCalledTimes(2)
    expect(deleteCategory).toHaveBeenNthCalledWith(1, 7)
    expect(deleteCategory).toHaveBeenNthCalledWith(2, 8)

    rowRequest.resolve({})
    batchRequest.resolve({})
    await Promise.all([rowPromise, batchPromise])
    wrapper.unmount()
  })
})
