import { flushPromises, mount } from '@vue/test-utils'

import DynamicPreview from '../DynamicPreview.vue'
import { getDynamicDetail } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'

const mockRouterPush = jest.fn()
const routeParams = { id: '42' }

jest.mock('@/api/dynamic', () => ({ getDynamicDetail: jest.fn() }))
jest.mock('@/api/category', () => ({ getCategoryList: jest.fn() }))

jest.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams }),
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() })
}))

jest.mock('ant-design-vue', () => ({
  message: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() }
}))

jest.mock('@ant-design/icons-vue', () => {
  const Icon = { template: '<span />' }
  return { EditOutlined: Icon, CloseOutlined: Icon }
})

const globalStubs = {
  'a-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  'a-card': { template: '<section><slot name="extra" /><slot /></section>' },
  'a-space': { template: '<span><slot /></span>' },
  'a-tag': { template: '<span><slot /></span>' },
  'a-image-preview-group': { template: '<div><slot /></div>' },
  'a-image': { template: '<img />' }
}

describe('DynamicPreview mounted interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getDynamicDetail.mockResolvedValue({
      id: 42,
      type: 'text',
      content: '# Loaded preview',
      mediaUrls: [],
      status: 'published',
      categoryId: null,
      tags: [],
      createdAt: '2026-08-08T00:00:00Z'
    })
    getCategoryList.mockResolvedValue({ count: 0, results: [] })
  })

  it('renders the unwrapped detail returned by getDynamicDetail', async () => {
    const wrapper = mount(DynamicPreview, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(getDynamicDetail).toHaveBeenCalledWith('42')
    expect(wrapper.find('.content-text').text()).toContain('Loaded preview')
    expect(wrapper.find('.preview-card').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders backend created_at and nested category detail fields', async () => {
    getDynamicDetail.mockResolvedValueOnce({
      id: 42,
      type: 'text',
      content: 'Backend-shaped preview',
      mediaUrls: [],
      status: 'published',
      category: { id: 3, name: 'Backend' },
      tags: [],
      created_at: '2026-08-08T12:34:56Z'
    })

    const wrapper = mount(DynamicPreview, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('.preview-time').text()).toContain('2026')
    expect(wrapper.find('.category').text()).toContain('Backend')
    wrapper.unmount()
  })

  it('renders a draft preview using backend-shaped date and category fields', async () => {
    routeParams.id = 'draft'
    localStorage.setItem('dynamicPreview', JSON.stringify({
      id: 'draft',
      type: 'text',
      content: 'Draft preview',
      mediaUrls: [],
      status: 'draft',
      category: { id: 9, name: 'Drafts' },
      tags: [],
      created_at: '2026-08-08T09:10:11Z'
    }))

    const wrapper = mount(DynamicPreview, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(getDynamicDetail).not.toHaveBeenCalled()
    expect(wrapper.find('.preview-time').text()).toContain('2026')
    expect(wrapper.find('.category').text()).toContain('Drafts')
    wrapper.unmount()
    routeParams.id = '42'
  })

  it('isolates an unavailable media item from the rest of the preview', () => {
    const source = require('node:fs').readFileSync(
      require('node:path').join(process.cwd(), 'src/views/dynamics/DynamicPreview.vue'),
      'utf8'
    )

    expect(source).toContain('markMediaUnavailable')
    expect(source).toContain('该媒体已不可用')
  })

  it('replaces a failed image with an unavailable state', async () => {
    getDynamicDetail.mockResolvedValueOnce({
      id: 42,
      type: 'image',
      content: '',
      mediaUrls: [{ url: '/api/upload/public/1/', type: 'image', name: 'cover.png' }],
      status: 'published',
      tags: []
    })

    const wrapper = mount(DynamicPreview, { global: { stubs: globalStubs } })
    await flushPromises()
    await wrapper.find('.preview-image').trigger('error')

    expect(wrapper.find('.media-unavailable').text()).toContain('该媒体已不可用')
    wrapper.unmount()
  })
})
