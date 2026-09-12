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

  it('switches to the fallback when Ant Avatar reports an image load error', async () => {
    const wrapper = mount(UserAvatar, {
      props: { src: '/media/avatars/missing.png', nickname: '站点作者' },
      global: {
        stubs: {
          'a-avatar': {
            props: { src: String, loadError: Function },
            template: '<div><button type="button" @click="loadError?.()">fail</button><slot /></div>'
          }
        }
      }
    })

    expect(wrapper.find('.user-avatar__icon').exists()).toBe(false)
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.user-avatar__icon').exists()).toBe(true)
  })

  it('uses a deterministic anonymous avatar asset when requested', () => {
    const wrapper = mount(UserAvatar, {
      props: { fallback: 'anonymous', fallbackSeed: 36, nickname: '匿名用户' },
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
      '/assets/default-avatars/anonymous/anonymous-05.webp'
    )
  })
})
