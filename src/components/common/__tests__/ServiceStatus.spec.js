import { mount } from '@vue/test-utils'
import ServiceStatus from '../ServiceStatus.vue'

describe('ServiceStatus', () => {
  it('uses an in-app detail popover instead of the native browser tooltip', async () => {
    const wrapper = mount(ServiceStatus, {
      props: {
        state: 'ok',
        checkedAt: '2026-09-11T06:30:00.000Z',
        latency: 414
      }
    })
    const button = wrapper.get('button')

    expect(button.attributes('title')).toBeUndefined()
    await button.trigger('mouseenter')

    expect(wrapper.get('[role="tooltip"]').text()).toContain('后台 API')
    expect(wrapper.get('[role="tooltip"]').text()).toContain('414ms')
    expect(button.attributes('aria-describedby')).toBe('service-status-detail')

    await button.trigger('mouseleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('emits a health check when clicked', async () => {
    const wrapper = mount(ServiceStatus)

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('check')).toHaveLength(1)
  })
})
