import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import BlogDynamic from '../BlogDynamic.vue'
import { getBlogDynamicTimeline, setLocale, ensureLocaleLoaded, currentLocale } from '@/i18n'

// TIMELINE 定义在工厂内：jest.mock 会被提升到 const 声明之前，引用外部 const 会拿到 undefined
jest.mock('@/api/blog', () => {
  const makeTimeline = () => [
    { key: '2026-11', year: 2026, monthLabel: '11月', count: 6 },
    { key: '2026-10', year: 2026, monthLabel: '10月', count: 27 },
    { key: '2026-09', year: 2026, monthLabel: '9月', count: 34 },
    { key: '2025-12', year: 2025, monthLabel: '12月', count: 8 }
  ]
  return {
    // 列表需非空：时间轴 aside 在 v-if="dynamicList.length > 0" 布局分支内
    getBlogDynamics: jest.fn(() => Promise.resolve({ code: 200, data: { items: [
      { id: 1, title: '示例', content: '正文', created_at: '2026-11-05T10:00:00Z', views: 2, likes: 0, comments: 0, type: 'text', status: 'published' }
    ], total: 1 } })),
    getBlogDynamicTimeline: jest.fn(() => Promise.resolve({ code: 200, data: makeTimeline() })),
    getDynamicComments: jest.fn(() => Promise.resolve({ code: 200, data: { items: [], total: 0 } })),
    likeDynamic: jest.fn(() => Promise.resolve({ code: 200, data: {} }))
  }
})

jest.mock('@/utils/blogCodeBlocks', () => ({
  bindCodeBlockInteractions: jest.fn(() => [])
}))

describe('书遇时间轴：年份分组 + 月份本地化', () => {
  let wrapper

  const mountPage = async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    wrapper = mount(BlogDynamic, { global: { plugins: [pinia] } })
    await flushPromises()
    await flushPromises()
  }

  const texts = (selector) => wrapper.findAll(selector).map(el => el.text())

  beforeEach(() => {
    window.localStorage.clear()
    setLocale('zh')
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('月份按当前语言本地化（后端 monthLabel 恒为中文，前端以 key 重新推导）', async () => {
    await mountPage()
    // zh 默认：Intl 'short' 月份 = 11月/10月/9月/12月（首个 strong 是「全部」按钮）
    expect(texts('.dynamic-timeline__nav .timeline-month strong')).toEqual(['11月', '10月', '9月', '12月'])

    await ensureLocaleLoaded('en')
    setLocale('en')
    await flushPromises()
    expect(texts('.dynamic-timeline__nav .timeline-month strong')).toEqual(['Nov', 'Oct', 'Sep', 'Dec'])
    expect(currentLocale.value).toBe('en')
  })

  it('年份分组行：显示年合计 + 折叠箭头，点击折叠/展开该年月份', async () => {
    await mountPage()
    // 年合计 = 该年全部月份之和（6+27+34=67）
    const toggleTexts = () => wrapper.findAll('.timeline-year-toggle').map(el => el.text())
    expect(toggleTexts()).toEqual(['202667 篇', '20258 篇'])
    // 默认全部展开（aria-expanded true），月份可见
    expect(wrapper.findAll('.timeline-year-toggle')[0].attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('.timeline-month').map(el => el.text())).toEqual(['11月6 篇', '10月27 篇', '9月34 篇', '12月8 篇'])

    // 点击 2026 年头 → 该年月份折叠（v-show 隐藏，DOM 仍在——断言可见性而非存在性），2025 不受影响
    await wrapper.findAll('.timeline-year-toggle')[0].trigger('click')
    const visibleMonths = () => wrapper.findAll('.timeline-month').filter(el => el.isVisible()).map(el => el.text())
    expect(visibleMonths()).toEqual(['12月8 篇'])
    expect(wrapper.findAll('.timeline-year-toggle')[0].attributes('aria-expanded')).toBe('false')

    // 再点 → 展开
    await wrapper.findAll('.timeline-year-toggle')[0].trigger('click')
    expect(visibleMonths()).toEqual(['11月6 篇', '10月27 篇', '9月34 篇', '12月8 篇'])
  })

  it('当前筛选的年份在折叠头上高亮（is-filtered）', async () => {
    await mountPage()
    // 未筛选：无高亮
    expect(wrapper.findAll('.timeline-year-toggle')[0].classes()).not.toContain('is-filtered')
    // 选 2026-09 → 2026 年头高亮（点击后重渲染，需重新查找元素）
    await wrapper.findAll('.timeline-month')[2].trigger('click')
    const toggles = wrapper.findAll('.timeline-year-toggle')
    expect(toggles[0].classes()).toContain('is-filtered')
    expect(toggles[1].classes()).not.toContain('is-filtered')
  })

  it('key 缺失或非法时回退后端 monthLabel，不抛错', async () => {
    // 模拟后端给了一条无 key 的脏数据
    const { getBlogDynamicTimeline: mockedTimeline } = require('@/api/blog')
    mockedTimeline.mockReturnValueOnce(Promise.resolve({ code: 200, data: [
      { key: '', year: 2026, monthLabel: '十一月（脏数据）', count: 1 }
    ]}))
    await mountPage()
    expect(texts('.dynamic-timeline__nav .timeline-month strong')).toEqual(['十一月（脏数据）'])
    expect(wrapper.findAll('.timeline-year-toggle')[0].text()).toContain('2026')
  })
})
