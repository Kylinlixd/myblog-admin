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
    expect(texts('.dynamic-timeline__nav strong')).toEqual(['动态', '11月', '10月', '9月', '12月'])

    await ensureLocaleLoaded('en')
    setLocale('en')
    await flushPromises()
    expect(texts('.dynamic-timeline__nav strong')).toEqual(['Articles', 'Nov', 'Oct', 'Sep', 'Dec'])
    expect(currentLocale.value).toBe('en')
  })

  it('年份只在每年第一个月显示，后续月份隐藏占位形成分组', async () => {
    await mountPage()
    const yearEls = wrapper.findAll('.dynamic-timeline__nav .timeline-year')
    expect(yearEls.map(el => el.text())).toEqual(['全部', '2026', '2026', '2026', '2025'])
    // 2026 的后两个月重复 → 隐藏占位；2025 是新年份 → 显示
    expect(yearEls[1].classes()).not.toContain('is-dup')
    expect(yearEls[2].classes()).toContain('is-dup')
    expect(yearEls[3].classes()).toContain('is-dup')
    expect(yearEls[4].classes()).not.toContain('is-dup')
    // 每年首月的按钮带 has-year 分组标记（供桌面端加组间距）
    const buttons = wrapper.findAll('.dynamic-timeline__nav button')
    expect(buttons[1].classes()).toContain('has-year')
    expect(buttons[2].classes()).not.toContain('has-year')
    expect(buttons[4].classes()).toContain('has-year')
  })

  it('key 缺失或非法时回退后端 monthLabel，不抛错', async () => {
    // 模拟后端给了一条无 key 的脏数据
    const { getBlogDynamicTimeline: mockedTimeline } = require('@/api/blog')
    mockedTimeline.mockReturnValueOnce(Promise.resolve({ code: 200, data: [
      { key: '', year: 2026, monthLabel: '十一月（脏数据）', count: 1 }
    ]}))
    await mountPage()
    expect(texts('.dynamic-timeline__nav strong')).toEqual(['动态', '十一月（脏数据）'])
    expect(texts('.dynamic-timeline__nav .timeline-year')).toEqual(['全部', '2026'])
  })
})
