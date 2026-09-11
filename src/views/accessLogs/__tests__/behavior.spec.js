import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import AccessLogList from '../AccessLogList.vue'
import { getAccessLogOverview, getAccessLogProfiles, getAccessLogRules } from '@/api/accessLog'

jest.mock('@/api/accessLog', () => ({
  getAccessLogOverview: jest.fn(),
  getAccessLogList: jest.fn(),
  getAccessLogProfiles: jest.fn(),
  getAccessLogRules: jest.fn()
}))
jest.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))
jest.mock('@/views/dashboard/DashboardChart.vue', () => ({ template: '<div />' }))

const profile = {
  ip_address: '198.51.100.20',
  ip_type: '公网 IPv4',
  scope: 'public',
  risk_level: 'high',
  risk_score: 50,
  risk_reasons: ['客户端错误集中（66/68，97.1%）'],
  behavior: {
    total_requests: 688,
    risk: {
      total_requests: 68,
      failed_requests: 66,
      error_rate: 97.1,
      client_errors: 66,
      server_errors: 0,
      auth_failures: 0,
      write_count: 3,
      recent_1m: 0,
      anomaly_level: 'high',
      anomaly_reasons: ['请求失败集中（失败 66/68，97.1%）']
    }
  }
}

const stubs = {
  PageHeader: true,
  DashboardChart: true,
  Pagination: true,
  'router-link': true,
  'a-space': true,
  'a-checkbox': true,
  'a-input-number': true,
  'a-textarea': true,
  'a-form': { template: '<form><slot /></form>' },
  'a-form-item': { template: '<div><slot /></div>' },
  'a-select': { template: '<select><slot /></select>' },
  'a-select-option': { template: '<option><slot /></option>' },
  'a-input': true,
  'a-button': { template: '<button><slot /></button>' },
  'a-tag': { template: '<span><slot /></span>' },
  'a-modal': { template: '<div><slot /></div>' },
  'a-drawer': { template: '<div><slot /></div>' },
  DataTable: {
    props: ['data'],
    template: '<div><div v-for="row in data" :key="row.ip_address"><slot name="behavior" :row="row" /><slot name="risk" :row="row" /></div></div>'
  }
}

function mountPage(list = [profile]) {
  getAccessLogProfiles.mockResolvedValue({ data: { list, total: list.length, summary: { high_risk: 1 } } })
  getAccessLogOverview.mockResolvedValue({ data: { active_ips: 265, high_risk_ips: 6, active_rules: 0, blocked_requests: 0 } })
  getAccessLogRules.mockResolvedValue([])
  return mount(AccessLogList, { global: { stubs } })
}

it('keeps overview card totals independent from the selected profile list', async () => {
  const wrapper = mountPage([])
  await flushPromises()

  expect(wrapper.findAll('.summary-card')[0].text()).toContain('265')
  wrapper.vm.selectSummary('high-risk')
  await flushPromises()

  expect(wrapper.findAll('.summary-card')[0].text()).toContain('265')
  expect(wrapper.findAll('.summary-card')[1].text()).toContain('6')
  wrapper.unmount()
})

it('renders window behavior counts and anomaly details with separate error classes', async () => {
  const wrapper = mountPage()
  await flushPromises()

  expect(wrapper.text()).toContain('近7天总请求：68次')
  expect(wrapper.text()).toContain('失败率：97.1%')
  wrapper.vm.selectedProfile = profile
  await nextTick()
  expect(wrapper.text()).toContain('客户端错误（4xx）：66次')
  expect(wrapper.text()).toContain('服务端错误（5xx）：0次')
  expect(wrapper.text()).toContain('高度异常')
  expect(wrapper.text()).toContain('请求失败集中（失败 66/68，97.1%）')
  expect(wrapper.text()).not.toContain('近7天总请求：688次')
  wrapper.unmount()
})

it('keeps anomaly details visible for a whitelisted profile', async () => {
  const wrapper = mountPage([])
  await flushPromises()
  wrapper.vm.selectedProfile = { ...profile, risk_level: 'low', risk_score: 0, risk_reasons: ['可信白名单，已豁免风险评级'] }
  await nextTick()

  expect(wrapper.text()).toContain('可信白名单，已豁免风险评级')
  expect(wrapper.text()).toContain('高度异常')
  expect(wrapper.text()).toContain('请求失败集中（失败 66/68，97.1%）')
  wrapper.unmount()
})

it('shows em dashes when old responses lack window behavior fields', async () => {
  const oldProfile = {
    ...profile,
    behavior: { total_requests: 688, risk: { client_errors: 66, server_errors: 0, write_count: 3 } }
  }
  const wrapper = mountPage([oldProfile])
  await flushPromises()

  expect(wrapper.text()).toContain('近7天总请求：—')
  expect(wrapper.text()).toContain('失败率：—')
  expect(wrapper.text()).not.toContain('近7天总请求：688次')
  wrapper.unmount()
})

it('does not render an anomaly label for a normal window', async () => {
  const normalProfile = {
    ...profile,
    risk_level: 'low',
    risk_score: 0,
    risk_reasons: ['未发现明显IP安全风险'],
    behavior: {
      ...profile.behavior,
      risk: {
        ...profile.behavior.risk,
        total_requests: 10,
        failed_requests: 0,
        error_rate: 0,
        client_errors: 0,
        server_errors: 0,
        anomaly_level: 'normal',
        anomaly_reasons: []
      }
    }
  }
  const wrapper = mountPage([normalProfile])
  await flushPromises()
  wrapper.vm.selectedProfile = normalProfile
  await nextTick()

  expect(wrapper.text()).not.toContain('异常')
  wrapper.unmount()
})
