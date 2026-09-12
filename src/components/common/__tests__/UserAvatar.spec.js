import { mount } from '@vue/test-utils'
import UserAvatar from '../UserAvatar.vue'

jest.mock('@/utils/apiBaseUrl', () => ({
  buildApiUrl: (url) => url.startsWith('/') ? `https://api.example.test${url}` : url
}))

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

  it('resolves relative uploaded avatar URLs against the API origin', () => {
    const wrapper = mount(UserAvatar, {
      props: { src: '/media/avatars/author.png', nickname: '站点作者' },
      global: {
        stubs: {
          'a-avatar': {
            props: { src: String },
            template: '<div :data-src="src"><slot /></div>'
          }
        }
      }
    })

    expect(wrapper.find('[data-src]').attributes('data-src')).toBe(
      'https://api.example.test/media/avatars/author.png'
    )
  })
})
