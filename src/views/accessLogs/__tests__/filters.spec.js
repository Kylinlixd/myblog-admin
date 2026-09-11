import { mount, flushPromises } from '@vue/test-utils'
import AccessLogList from '../AccessLogList.vue'
import { getAccessLogOverview, getAccessLogProfiles, getAccessLogRules } from '@/api/accessLog'

jest.mock('@/api/accessLog', () => ({ getAccessLogOverview: jest.fn(), getAccessLogProfiles: jest.fn(), getAccessLogRules: jest.fn() }))
jest.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))
jest.mock('@/views/dashboard/DashboardChart.vue', () => ({ template: '<div />' }))

it('sends all filters together and resets them with pagination; uses global risk summary', async () => {
  getAccessLogProfiles.mockResolvedValue({ data: { list: [], total: 83, summary: { high_risk: 12 } } })
  getAccessLogOverview.mockResolvedValue({ data: { active_ips: 83, high_risk_ips: 12, active_rules: 0, blocked_requests: 0 } })
  getAccessLogRules.mockResolvedValue([])
  const wrapper = mount(AccessLogList, { global: { stubs: {
    PageHeader: true, DataTable: true, Pagination: true, 'router-link': true, 'a-tag': true, 'a-space': true, 'a-checkbox': true, 'a-input-number': true, 'a-textarea': true,
    'a-form': { template: '<form><slot /></form>' }, 'a-form-item': { template: '<div><slot /></div>' },
    'a-select': { template: '<select><slot /></select>' }, 'a-select-option': { template: '<option><slot /></option>' },
    'a-input': true, 'a-button': { template: '<button><slot /></button>' },
    'a-drawer': true, 'a-modal': true
  } } })
  await flushPromises()
  expect(wrapper.text()).toContain('12')
  wrapper.vm.filters = { ip: '36.28.0.0/16', risk: 'medium', network: 'public', region: '杭州' }
  wrapper.vm.page = 3
  wrapper.vm.applyFilters()
  await flushPromises()
  expect(getAccessLogProfiles).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, window: '7d', ip: '36.28.0.0/16', risk: 'medium', network: 'public', region: '杭州' })
  wrapper.vm.resetFilters()
  await flushPromises()
  expect(getAccessLogProfiles).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, window: '7d' })
  for (const label of ['低风险', '中风险', '高风险', '严重风险']) expect(wrapper.text()).toContain(label)
  wrapper.unmount()
})
