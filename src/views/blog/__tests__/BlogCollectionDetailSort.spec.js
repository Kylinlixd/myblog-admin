import { mount, flushPromises } from '@vue/test-utils'

jest.mock('@/api/blog', () => ({
  getBlogCollectionDetail: jest.fn(),
}))

jest.mock('@/stores/app', () => {
  const store = {
    startLoading: jest.fn(),
    endLoading: jest.fn(),
    setLoadingError: jest.fn(),
  }
  return { useAppStore: () => store }
})

jest.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '7' } }),
}))

const { getBlogCollectionDetail } = require('@/api/blog')
const BlogCollectionDetail = require('../BlogCollectionDetail.vue').default

const fixtureItems = [
  { sort: 1, id: 101, title: '最早的一篇', createdAt: '2026-08-02T20:30:00+08:00', viewCount: 11 },
  { sort: 2, id: 102, title: '中间的一篇', createdAt: '2026-09-06T20:30:00+08:00', viewCount: 22 },
  { sort: 3, id: 103, title: '最新的一篇', createdAt: '2026-10-04T20:30:00+08:00', viewCount: 33 },
]

async function mountDetail(items = fixtureItems) {
  getBlogCollectionDetail.mockResolvedValue({
    code: 200,
    data: {
      id: 7,
      title: '读书笔记专栏',
      description: '每周一篇，把经典一本本读薄。',
      cover: '',
      itemCount: items.length,
      items,
    },
  })
  const wrapper = mount(BlogCollectionDetail, {
    global: {
      stubs: { 'router-link': { template: '<a><slot /></a>' } },
    },
  })
  await flushPromises()
  return wrapper
}

function findSortButton(wrapper, label) {
  return wrapper.findAll('.sort-option').find((node) => node.text() === label)
}

describe('BlogCollectionDetail catalog sorting', () => {
  beforeEach(() => {
    getBlogCollectionDetail.mockReset()
  })

  it('renders the catalog in collection order (oldest first) by default', async () => {
    const wrapper = await mountDetail()
    // 接口契约：order 参数与排序状态同步传给后端
    expect(getBlogCollectionDetail).toHaveBeenCalledWith('7', { order: 'oldest' })
    const titles = wrapper.findAll('.row-title').map((node) => node.text())
    expect(titles).toEqual(['最早的一篇', '中间的一篇', '最新的一篇'])
    expect(findSortButton(wrapper, '从最早看起').classes()).toContain('sort-option--active')
    expect(wrapper.find('.detail-meta').text()).toContain('从最早一期开始')
  })

  it('shows the latest published article first after clicking the latest toggle', async () => {
    const wrapper = await mountDetail()
    await findSortButton(wrapper, '从最新看起').trigger('click')

    const titles = wrapper.findAll('.row-title').map((node) => node.text())
    expect(titles).toEqual(['最新的一篇', '中间的一篇', '最早的一篇'])
    expect(findSortButton(wrapper, '从最新看起').classes()).toContain('sort-option--active')
    expect(wrapper.find('.detail-meta').text()).toContain('从最新一期开始')
    // 序号跟随当前展示顺序：最新一期排 01
    expect(wrapper.find('.row-index').text()).toBe('01')
  })

  it('switches back to collection order when clicking oldest again', async () => {
    const wrapper = await mountDetail()
    await findSortButton(wrapper, '从最新看起').trigger('click')
    await findSortButton(wrapper, '从最早看起').trigger('click')

    const titles = wrapper.findAll('.row-title').map((node) => node.text())
    expect(titles).toEqual(['最早的一篇', '中间的一篇', '最新的一篇'])
  })
})
