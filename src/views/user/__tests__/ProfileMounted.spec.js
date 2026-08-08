import { flushPromises, mount } from '@vue/test-utils'

import Profile from '../Profile.vue'
import { changePassword } from '@/api/auth'

const mockUserStore = {
  userInfo: {
    username: 'reader',
    nickname: 'Reader',
    email: 'reader@example.com',
    bio: 'About me',
    avatar: '/media/avatar.png'
  },
  updateProfile: jest.fn(),
  getUserInfo: jest.fn()
}

jest.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore
}))

jest.mock('@/api/auth', () => ({
  changePassword: jest.fn()
}))

jest.mock('ant-design-vue', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}))

const FormStub = {
  inheritAttrs: false,
  template: '<form v-bind="$attrs"><slot /></form>'
}

const globalStubs = {
  'a-card': { template: '<section><slot name="header" /><slot /></section>' },
  'a-form': FormStub,
  'a-form-item': { template: '<label><slot /></label>' },
  'a-input': true,
  'a-input-password': true,
  'a-textarea': true,
  'a-avatar': true,
  'a-upload': true,
  'a-button': true
}

describe('Profile mounted interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUserStore.updateProfile.mockResolvedValue(mockUserStore.userInfo)
    mockUserStore.getUserInfo.mockResolvedValue(mockUserStore.userInfo)
    changePassword.mockResolvedValue({})
  })

  it('keeps edited profile fields when saving fails', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.profileFormRef = { validate: jest.fn().mockResolvedValue({ ...wrapper.vm.profileForm }) }
    wrapper.vm.profileForm.nickname = 'Unsaved nickname'
    mockUserStore.updateProfile.mockRejectedValueOnce(new Error('保存失败'))

    await wrapper.vm.handleProfileUpdate()

    expect(wrapper.vm.profileForm.nickname).toBe('Unsaved nickname')
    expect(wrapper.find('[data-testid="profile-save-error"]').text()).toContain('保存失败')
    expect(wrapper.vm.profileLoading).toBe(false)
    wrapper.unmount()
  })

  it('marks both forms as stackable for mobile layouts', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.findAll('.profile-form-stackable')).toHaveLength(2)
    expect(wrapper.find('.profile-form-stackable').attributes('data-mobile-stack')).toBe('true')
    wrapper.unmount()
  })
})
