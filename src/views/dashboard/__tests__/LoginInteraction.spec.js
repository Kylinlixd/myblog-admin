import { flushPromises, mount } from '@vue/test-utils'

import Login from '@/views/Login.vue'

const mockLogin = jest.fn()

jest.mock('@/stores/user', () => ({
  useUserStore: () => ({ login: mockLogin })
}))

jest.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: jest.fn() })
}))

const ButtonStub = {
  props: ['loading', 'disabled', 'htmlType'],
  template: '<button :type="htmlType === \'submit\' ? \'submit\' : \'button\'" :disabled="disabled || loading" v-bind="$attrs"><slot /></button>'
}

const globalStubs = {
  'a-alert': { props: ['message'], template: '<div class="login-error">{{ message }}</div>' },
  'a-button': ButtonStub,
  'a-form': {
    emits: ['finish'],
    template: '<form @submit.prevent="$emit(\'finish\')"><slot /></form>'
  },
  'a-form-item': { template: '<div><slot /></div>' },
  'a-input': { props: ['size', 'autocomplete', 'placeholder', 'value'], template: '<input />' },
  'a-input-password': { props: ['size', 'autocomplete', 'placeholder', 'value'], template: '<input type="password" />' },
  'user-outlined': true,
  'lock-outlined': true,
  'router-link': { template: '<a><slot /></a>' }
}

describe('Login mounted interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps the submit button disabled while login is pending', async () => {
    let resolveLogin
    mockLogin.mockReturnValueOnce(new Promise((resolve) => { resolveLogin = resolve }))
    const wrapper = mount(Login, { global: { stubs: globalStubs } })

    const submit = wrapper.find('form')
    await submit.trigger('submit')
    await flushPromises()

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

    resolveLogin(true)
    await flushPromises()
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('renders the login error returned by the store', async () => {
    mockLogin.mockResolvedValueOnce(false)
    const wrapper = mount(Login, { global: { stubs: globalStubs } })

    await wrapper.vm.handleLogin()
    await flushPromises()

    expect(wrapper.find('.login-error').text()).toContain('用户名或密码错误')
    wrapper.unmount()
  })
})
