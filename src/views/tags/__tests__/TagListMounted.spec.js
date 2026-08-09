import { flushPromises, mount } from '@vue/test-utils'

import TagList from '../TagList.vue'
import { createTag, deleteTag, getTagList, updateTag } from '@/api/tag'

jest.mock('@/api/tag', () => ({
  getTagList: jest.fn(),
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn()
}))

jest.mock('ant-design-vue', () => ({
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

const globalStubs = {
  PageHeader: true,
  'a-button': {
    inheritAttrs: false,
    props: { loading: Boolean, disabled: Boolean },
    template: '<button v-bind="$attrs" :disabled="disabled" :data-loading="loading ? \'true\' : undefined"><slot /></button>'
  },
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

const deferred = () => {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

describe('TagList mounted states and taxonomy actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getTagList.mockResolvedValue({ count: 0, results: [] })
    createTag.mockResolvedValue({ id: 8, name: 'Vue' })
    updateTag.mockResolvedValue({ id: 8, name: 'Vue 3' })
    deleteTag.mockResolvedValue({})
  })

  it('renders an empty state and retries after an error', async () => {
    getTagList.mockRejectedValueOnce(new Error('标签加载失败'))
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="tag-async-state"]').text()).toContain('标签加载失败')
    getTagList.mockResolvedValueOnce({ count: 0, results: [] })
    await wrapper.find('.state-retry').trigger('click')
    await flushPromises()
    expect(getTagList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('creates, edits, and deletes a tag through normalized APIs', async () => {
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.formRef = null

    wrapper.vm.handleAdd()
    wrapper.vm.tagForm.name = 'Vue'
    await wrapper.vm.handleSubmit()
    expect(createTag).toHaveBeenCalledWith(expect.objectContaining({ name: 'Vue' }))

    wrapper.vm.handleEdit({ id: 8, name: 'Vue', description: '', status: 'active' })
    wrapper.vm.tagForm.name = 'Vue 3'
    await wrapper.vm.handleSubmit()
    expect(updateTag).toHaveBeenCalledWith(8, expect.objectContaining({ name: 'Vue 3' }))

    await wrapper.vm.handleDelete({ id: 8 })
    expect(deleteTag).toHaveBeenCalledWith(8)
    wrapper.unmount()
  })

  it('uses readable fixed widths and sortable metadata columns', async () => {
    getTagList.mockResolvedValueOnce({
      count: 1,
      results: [{ id: 8, name: 'Vue', description: '前端开发相关主题', useCount: 12 }]
    })
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.vm.columns.find((column) => column.dataIndex === 'name').width).toBe(180)
    expect(wrapper.vm.columns.find((column) => column.dataIndex === 'description').width).toBe(280)
    expect(wrapper.vm.columns.find((column) => column.dataIndex === 'useCount').sorter({ useCount: 1 }, { useCount: 2 })).toBeLessThan(0)
    expect(wrapper.vm.columns.find((column) => column.dataIndex === 'createdAt').sorter).toEqual(expect.any(Function))
    expect(wrapper.vm.columns.find((column) => column.dataIndex === 'updatedAt').sorter).toEqual(expect.any(Function))
    wrapper.unmount()
  })

  it('guards the batch delete action while its requests are pending', async () => {
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    let resolve
    deleteTag.mockReturnValue(new Promise((res) => { resolve = res }))
    wrapper.vm.selectedRowKeys = [8, 9]

    const firstBatch = wrapper.vm.handleBatchDelete()
    await wrapper.vm.$nextTick()

    const batchButton = wrapper.find('.admin-toolbar button')
    expect(wrapper.vm.batchDeleting).toBe(true)
    expect(batchButton.attributes('disabled')).toBeDefined()
    expect(batchButton.attributes('data-loading')).toBe('true')

    await wrapper.vm.handleBatchDelete()
    expect(deleteTag).toHaveBeenCalledTimes(2)

    resolve({})
    await firstBatch
    expect(wrapper.vm.batchDeleting).toBe(false)
    wrapper.unmount()
  })

  it('sends the current page and page size and resets to page one for search and reset', async () => {
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    getTagList.mockResolvedValue({ count: 1, results: [{ id: 1, name: 'Vue' }] })

    wrapper.vm.pagination.onChange(3, 20)
    await flushPromises()
    expect(getTagList).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      name: undefined,
      status: undefined
    })

    wrapper.vm.handleSearch()
    await flushPromises()
    expect(wrapper.vm.pagination.current).toBe(1)
    expect(getTagList).toHaveBeenLastCalledWith({
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

  it('requests once when the pagination component emits both page-size callbacks', async () => {
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    getTagList.mockClear()

    expect(wrapper.vm.pagination.onShowSizeChange).toBeUndefined()
    wrapper.vm.pagination.onChange(1, 20)
    await flushPromises()

    expect(wrapper.vm.pagination.current).toBe(1)
    expect(wrapper.vm.pagination.pageSize).toBe(20)
    expect(getTagList).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('resets an empty out-of-range page once while keeping the current filters', async () => {
    getTagList.mockResolvedValueOnce({ count: 1, results: [{ id: 1, name: 'Vue' }] })
      .mockResolvedValueOnce({ count: 0, results: [] })
      .mockResolvedValueOnce({ count: 1, results: [{ id: 1, name: 'Vue' }] })
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.searchForm.name = 'Vu'
    wrapper.vm.pagination.current = 2

    await wrapper.vm.fetchTags()
    expect(wrapper.vm.pagination.current).toBe(1)
    expect(getTagList).toHaveBeenLastCalledWith({
      page: 1, pageSize: 10, name: 'Vu', status: undefined
    })
    expect(wrapper.vm.tagList).toHaveLength(1)
    wrapper.unmount()
  })

  it('keeps a newer request loading and prevents an older response from committing', async () => {
    const first = deferred()
    const second = deferred()
    getTagList.mockReset()
    getTagList.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    const newerRequest = wrapper.vm.fetchTags()
    await wrapper.vm.$nextTick()

    first.resolve({ count: 1, results: [{ id: 1, name: 'old' }] })
    await flushPromises()
    expect(wrapper.vm.loading).toBe(true)
    expect(wrapper.vm.tagList).toEqual([])

    second.resolve({ count: 1, results: [{ id: 2, name: 'new' }] })
    await newerRequest
    expect(wrapper.vm.tagList).toEqual([{ id: 2, name: 'new', status: 'inactive', useCount: 0 }])
    expect(wrapper.vm.loading).toBe(false)
    wrapper.unmount()
  })

  it('does not let a batch delete repeat a row delete already in progress', async () => {
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    let resolveRow
    let resolveBatch
    deleteTag.mockImplementation((id) => id === 8
      ? new Promise((resolve) => { resolveRow = resolve })
      : new Promise((resolve) => { resolveBatch = resolve }))

    const rowPromise = wrapper.vm.handleDelete({ id: 8 })
    await wrapper.vm.$nextTick()
    wrapper.vm.selectedRowKeys = [8, 9]
    const batchPromise = wrapper.vm.handleBatchDelete()
    await wrapper.vm.$nextTick()

    expect(deleteTag).toHaveBeenCalledTimes(2)
    expect(deleteTag).toHaveBeenNthCalledWith(1, 8)
    expect(deleteTag).toHaveBeenNthCalledWith(2, 9)

    resolveRow({})
    resolveBatch({})
    await Promise.all([rowPromise, batchPromise])
    wrapper.unmount()
  })
})
