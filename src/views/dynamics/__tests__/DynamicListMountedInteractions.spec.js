import { flushPromises, mount } from '@vue/test-utils'

import DynamicList from '../DynamicList.vue'
import { getDynamicList, deleteDynamic } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'
import { getTagList } from '@/api/tag'

const mockRouterPush = jest.fn()

jest.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({ params: {} })
}))

jest.mock('@/api/dynamic', () => ({
  getDynamicList: jest.fn(),
  deleteDynamic: jest.fn()
}))

jest.mock('@/api/category', () => ({ getCategoryList: jest.fn() }))
jest.mock('@/api/tag', () => ({ getTagList: jest.fn() }))

const ButtonStub = {
  props: ['disabled', 'loading'],
  template: '<button :disabled="disabled || loading" :data-loading="loading ? \'true\' : undefined" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>'
}

const TableStub = {
  props: ['columns', 'dataSource', 'scroll'],
  template: `
    <div class="table" :data-scroll-x="scroll && scroll.x">
      <div v-for="record in dataSource" :key="record.id" class="table-row">
        <div v-for="column in columns" :key="column.dataIndex" :data-column="column.dataIndex">
          <slot name="bodyCell" :column="column" :record="record" />
          <span v-if="!['category', 'tags', 'like_count', 'status', 'created_at', 'updated_at', 'action'].includes(column.dataIndex)">{{ record[column.dataIndex] }}</span>
        </div>
      </div>
    </div>
  `
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
  'a-table': TableStub,
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

describe('DynamicList mounted interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterPush.mockResolvedValue(undefined)
    getCategoryList.mockResolvedValue({ count: 0, results: [] })
    getTagList.mockResolvedValue({ count: 0, results: [] })
    getDynamicList.mockResolvedValue({
      count: 2,
      results: [
        {
          id: 7,
          title: '',
          type: 'image',
          mediaUrls: ['/media/cover.png'],
          category: { id: 3, name: 'Frontend' },
          tags: [],
          status: 'draft',
          likes: 2
        },
        { id: 8, type: 'text', tags: [], status: 'published', like_count: 4 }
      ]
    })
  })

  it('renders normalized media, category, likes, and fallback title values', async () => {
    const wrapper = mount(DynamicList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.vm.dynamicList[0]).toMatchObject({
      mediaUrls: ['/media/cover.png'],
      category: { id: 3, name: 'Frontend' },
      like_count: 2,
      title: '无标题'
    })
    expect(wrapper.find('[data-column="title"]').text()).toBe('无标题')
    expect(wrapper.find('[data-column="category"]').text()).toContain('Frontend')
    expect(wrapper.find('[data-column="like_count"]').text()).toBe('2')
    expect(wrapper.find('.content-table-scroll').exists()).toBe(true)
    expect(wrapper.find('.table').attributes('data-scroll-x')).toBe('max-content')
    wrapper.unmount()
  })

  it('resets page and selection for filtering and reset', async () => {
    const wrapper = mount(DynamicList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.vm.dynamicList).toHaveLength(2)
    expect(wrapper.vm.total).toBe(2)

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

  it('routes the empty-state create action to the create editor', async () => {
    getDynamicList.mockResolvedValueOnce({ count: 0, results: [] })
    const wrapper = mount(DynamicList, { global: { stubs: globalStubs } })
    await flushPromises()

    const createButton = wrapper.find('.dynamic-empty [aria-label="新建动态"]')
    expect(createButton.exists()).toBe(true)
    await createButton.trigger('click')
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'CreateDynamic' })
    wrapper.unmount()
  })

  it('shows loading and disabled states for a pending batch delete', async () => {
    getDynamicList.mockResolvedValueOnce({ count: 0, results: [] })
    const wrapper = mount(DynamicList, { global: { stubs: globalStubs } })
    await flushPromises()

    wrapper.vm.selectedRowKeys = [7]
    let resolveDelete
    deleteDynamic.mockReturnValueOnce(new Promise((resolve) => { resolveDelete = resolve }))
    const request = wrapper.vm.handleBatchDelete()
    await flushPromises()
    expect(wrapper.find('.table-operations button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.table-operations button').attributes('data-loading')).toBe('true')
    resolveDelete()
    await request
    wrapper.unmount()
  })
})
