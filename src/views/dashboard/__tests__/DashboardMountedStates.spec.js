import { flushPromises, mount } from '@vue/test-utils'

import Dashboard from '@/views/Dashboard.vue'
import request from '@/services/http/client'

jest.mock('@/services/http/client', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}))

jest.mock('@/stores/user', () => ({
  useUserStore: () => ({ nickname: '管理员' })
}))

const ButtonStub = {
  template: '<button v-bind="$attrs"><slot /></button>'
}

const globalStubs = {
  'a-alert': { template: '<div class="dashboard-error"><slot name="action" /></div>' },
  'a-button': ButtonStub,
  'a-skeleton': { template: '<div class="dashboard-skeleton" />' },
  'router-link': { template: '<a><slot /></a>' },
  'plus-outlined': true,
  'comment-outlined': true,
  'file-text-outlined': true,
  'folder-outlined': true,
  'read-outlined': true,
  'right-outlined': true,
  'tags-outlined': true
}

describe('Dashboard mounted states', () => {
  beforeEach(() => jest.clearAllMocks())

  it('keeps the trend and taxonomy layout while loading and when empty', async () => {
    let resolveStats
    request.get.mockReturnValueOnce(new Promise((resolve) => { resolveStats = resolve }))
    const wrapper = mount(Dashboard, { global: { stubs: globalStubs } })

    expect(wrapper.find('.operations-grid').exists()).toBe(true)
    expect(wrapper.find('.content-pulse').exists()).toBe(true)
    expect(wrapper.find('.taxonomy-panel').exists()).toBe(true)

    resolveStats({ data: {} })
    await flushPromises()

    expect(wrapper.find('.operations-grid').exists()).toBe(true)
    expect(wrapper.find('.panel-empty').exists()).toBe(true)
    expect(wrapper.find('.compact-empty').exists()).toBe(true)
    wrapper.unmount()
  })

  it('offers an accessible retry action after a failed request', async () => {
    request.get.mockRejectedValueOnce(new Error('网络不可用'))
    const wrapper = mount(Dashboard, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('[aria-label="重试"]').exists()).toBe(true)
    expect(wrapper.find('.dashboard-intro').exists()).toBe(true)
    expect(wrapper.find('.metric-rail').exists()).toBe(true)
    expect(wrapper.find('.operations-grid').exists()).toBe(true)
    expect(wrapper.find('.content-pulse').exists()).toBe(true)
    expect(wrapper.find('.taxonomy-panel').exists()).toBe(true)

    request.get.mockResolvedValueOnce({ data: {} })
    await wrapper.find('[aria-label="重试"]').trigger('click')
    await flushPromises()
    expect(request.get).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})
