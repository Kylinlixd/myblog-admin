import { flushPromises, mount } from '@vue/test-utils'

import DynamicPreview from '../DynamicPreview.vue'
import { getDynamicDetail } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'

const mockRouterPush = jest.fn()

jest.mock('@/api/dynamic', () => ({ getDynamicDetail: jest.fn() }))
jest.mock('@/api/category', () => ({ getCategoryList: jest.fn() }))

jest.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' } }),
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
})
