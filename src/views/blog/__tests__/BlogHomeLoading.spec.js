import { mount, flushPromises } from '@vue/test-utils'
import BlogHome from '../BlogHome.vue'
import { getRecentDynamics, getBlogCategoryList } from '@/api/blog'

jest.mock('@/api/blog', () => ({ getRecentDynamics: jest.fn(), getBlogCategoryList: jest.fn() }))

describe('homepage viewport loading', () => {
  let observers
  let wrapper
  const originalObserver = window.IntersectionObserver
  const render = () => mount(BlogHome, { global: { stubs: {
    RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
    AsyncState: { props: ['error', 'loading'], template: '<div>{{ error }}</div>' }
  } } })
  beforeEach(() => {
    jest.clearAllMocks()
    observers = []
    window.IntersectionObserver = jest.fn(function (callback) {
      this.observe = jest.fn()
      this.disconnect = jest.fn()
      this.reveal = () => callback([{ isIntersecting: true }])
      observers.push(this)
    })
    getRecentDynamics.mockResolvedValue([{ id: 1, title: '异步请求与状态', summary: '一次真实项目中的实践。' }])
    getBlogCategoryList.mockResolvedValue([{ id: 2, name: '前端' }])
  })
  afterEach(() => {
    wrapper?.unmount()
    window.IntersectionObserver = originalObserver
  })
  it('renders the hero immediately but requests each content section only near the viewport', async () => {
    wrapper = render()
    await flushPromises()
    expect(wrapper.find('h1').text()).toContain('探')
    expect(getRecentDynamics).not.toHaveBeenCalled()
    expect(getBlogCategoryList).not.toHaveBeenCalled()
    observers[0].reveal()
    await flushPromises()
    expect(wrapper.findAll('.article-row')).toHaveLength(1)
    expect(wrapper.find('.article-row').attributes('href')).toBe('/blog/dynamics/1')
    expect(getBlogCategoryList).not.toHaveBeenCalled()
    observers[1].reveal()
    await flushPromises()
    expect(wrapper.find('.category-row').text()).toContain('前端')
    expect(observers.every(observer => observer.disconnect.mock.calls.length)).toBe(true)
  })
  it('keeps articles visible when categories fail and supports category retry', async () => {
    getBlogCategoryList.mockRejectedValueOnce(new Error('分类暂不可用'))
    wrapper = render()
    observers.forEach(observer => observer.reveal())
    await flushPromises()
    expect(wrapper.findAll('.article-row')).toHaveLength(1)
    expect(wrapper.find('.category-error').text()).toContain('分类暂不可用')
    await wrapper.find('.category-error button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.category-row').exists()).toBe(true)
  })
  it('falls back to loading without IntersectionObserver', async () => {
    delete window.IntersectionObserver
    wrapper = render()
    await flushPromises()
    expect(wrapper.find('.article-row').exists()).toBe(true)
    expect(wrapper.find('.category-row').exists()).toBe(true)
  })
  it('disconnects observers when navigating away before loading', () => {
    wrapper = render()
    wrapper.unmount()
    wrapper = null
    expect(observers.every(observer => observer.disconnect.mock.calls.length)).toBe(true)
    expect(getRecentDynamics).not.toHaveBeenCalled()
  })
})
