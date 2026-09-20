import fs from 'node:fs'
import path from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'

import Dashboard from '@/views/Dashboard.vue'
import request from '@/services/http/client'

jest.mock('@/services/http/client', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}))

jest.mock('@/views/dashboard/DashboardChart.vue', () => ({ name: 'DashboardChart', template: '<div class="chart-stub" />' }))

jest.mock('@/stores/user', () => ({
  useUserStore: () => ({ nickname: '管理员' })
}))

jest.mock('@/stores/commentNotifications', () => ({
  useCommentNotificationsStore: () => ({
    hasUnread: false,
    unreadCount: 0,
    latestCommentId: 0,
    refresh: jest.fn(),
    markRead: jest.fn(),
    startPolling: jest.fn(),
    stopPolling: jest.fn()
  })
}))

const globalStubs = {
  'a-alert': { template: '<div><slot name="action" /></div>' },
  'a-button': { template: '<button v-bind="$attrs"><slot /></button>' },
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

const readDashboard = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/views/Dashboard.vue'), 'utf8')

describe('dashboard metric rail on small screens', () => {
  beforeEach(() => jest.clearAllMocks())

  it('keeps four metric tiles in one row below the desktop breakpoints', () => {
    const source = readDashboard()
    const tablet = source.slice(
      source.indexOf('@media (max-width: 820px)'),
      source.indexOf('@media (max-width: 640px)')
    )
    const mobile = source.slice(source.indexOf('@media (max-width: 640px)'))

    // 移动端曾经把四个指标压成一列纵排，这里锁定必须保持一排四个
    expect(tablet).toContain('.metric-rail { grid-template-columns: repeat(4, minmax(0, 1fr)); }')
    expect(mobile).toContain('.metric-rail { grid-template-columns: repeat(4, minmax(0, 1fr)); }')
    expect(source).not.toContain('.metric-rail { grid-template-columns: 1fr; }')
    expect(source).not.toContain('.metric-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); }')

    // 一格四列时收紧图标、标题和数值，避免数据被挤掉
    expect(tablet).toContain('.metric-value { font-size: 22px; }')
    expect(mobile).toContain('.metric-value { font-size: 18px; }')
    expect(mobile).toContain('.metric-label { font-size: 9px; white-space: nowrap; }')
  })

  it('renders all four metrics inside the rail', async () => {
    request.get.mockResolvedValue({
      data: { total: { dynamics: 47, categories: 14, tags: 71, comments: 8 } }
    })
    const wrapper = mount(Dashboard, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.findAll('.metric-rail .metric-item')).toHaveLength(4)
    wrapper.unmount()
  })
})
