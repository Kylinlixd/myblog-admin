import { mount } from '@vue/test-utils'
import UserAvatar from '../UserAvatar.vue'

jest.mock('@ant-design/icons-vue', () => ({
  UserOutlined: { template: '<span class="user-outlined" />' }
}))

describe('UserAvatar', () => {
  it('uses the warm inline coffee fallback instead of a generic placeholder image', () => {
    const wrapper = mount(UserAvatar, {
      props: { tone: 'warm', nickname: '访客' },
      global: { stubs: { 'a-avatar': { template: '<div><slot /></div>' } } }
    })
    expect(wrapper.find('.user-avatar__coffee').exists()).toBe(true)
    expect(wrapper.find('.user-outlined').exists()).toBe(false)
  })
})
