import { flushPromises, mount } from '@vue/test-utils'

import DynamicList from '../DynamicList.vue'
import { getDynamicList, deleteDynamic } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'
import { getTagList } from '@/api/tag'

jest.mock('@/api/dynamic', () => ({
  getDynamicList: jest.fn(),
  deleteDynamic: jest.fn()
}))

jest.mock('@/api/category', () => ({ getCategoryList: jest.fn() }))
jest.mock('@/api/tag', () => ({ getTagList: jest.fn() }))

const ButtonStub = {
  props: ['disabled', 'loading'],
  template: '<button :disabled="disabled || loading" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>'
}

const globalStubs = {
  PageHeader: { template: '<header><slot name="actions" /></header>' },
  'a-button': ButtonStub,
  'a-card': { template: '<section><slot /></section>' },
  'a-form': { template: '<form><slot /></form>' },
  'a-form-item': { template: '<div><slot /></div>' },
  'a-input': { template: '<input />' },
  'a-select': { template: '<select><slot /></select>' },
  'a-select-option': { template: '<option><slot /></option>' },
  'a-space': { template: '<span><slot /></span>' },
  'a-table': { template: '<div class="table" />' },
  'a-tag': { template: '<span><slot /></span>' },
  'a-popconfirm': { template: '<span><slot /></span>' },
  'plus-outlined': true,
  'edit-outlined': true,
  'eye-outlined': true,
  'delete-outlined': true,
  'search-outlined': true,
  'reload-outlined': true,
  'router-link': { template: '<a><slot /></a>' }
}

const normalizedList = {
  count: 1,
  results: [{ id: 7, title: 'A post', type: 'text', tags: [], status: 'draft', likes: 2 }]
}

describe('DynamicList mounted interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getCategoryList.mockResolvedValue({ count: 0, results: [] })
    getTagList.mockResolvedValue({ count: 0, results: [] })
    getDynamicList.mockResolvedValue(normalizedList)
  })

  it('uses normalized data and resets page and selection for filtering and reset', async () => {
    const wrapper = mount(DynamicList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.vm.dynamicList).toHaveLength(1)
    expect(wrapper.vm.total).toBe(1)

    wrapper.vm.currentPage = 3
    wrapper.vm.selectedRowKeys = [7]
    wrapper.vm.searchForm.title = 'post'
    wrapper.vm.handleSearch()
    await flushPromises()
    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.selectedRowKeys).toEqual([])

    wrapper.vm.currentPage = 4
    wrapper.vm.selectedRowKeys = [7]
    wrapper.vm.resetSearch()
    await flushPromises()
    expect(wrapper.vm.currentPage).toBe(1)
    expect(wrapper.vm.selectedRowKeys).toEqual([])
    wrapper.unmount()
  })

  it('shows a create action for an empty list and disables batch delete while pending', async () => {
    getDynamicList.mockResolvedValueOnce({ count: 0, results: [] })
    const wrapper = mount(DynamicList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('.dynamic-empty [aria-label="新建动态"]').exists()).toBe(true)

    wrapper.vm.selectedRowKeys = [7]
    let resolveDelete
    deleteDynamic.mockReturnValueOnce(new Promise((resolve) => { resolveDelete = resolve }))
    const request = wrapper.vm.handleBatchDelete()
    await flushPromises()
    expect(wrapper.find('.table-operations button').attributes('disabled')).toBeDefined()
    resolveDelete()
    await request
    wrapper.unmount()
  })
})
