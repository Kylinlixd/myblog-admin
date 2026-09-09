import { flushPromises, mount } from '@vue/test-utils'

import Profile from '../Profile.vue'
import { changePassword, uploadAvatar } from '@/api/auth'

const mockUserStore = {
  userInfo: {
    username: 'reader',
    nickname: 'Reader',
    email: 'reader@example.com',
    bio: 'About me',
    avatar: '/media/avatar.png'
  },
  updateProfile: jest.fn(),
  getUserInfo: jest.fn(),
  syncAvatar: jest.fn((avatar) => { mockUserStore.userInfo.avatar = avatar })
}

jest.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore
}))

jest.mock('@/api/auth', () => ({
  changePassword: jest.fn(),
  uploadAvatar: jest.fn()
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
  'a-card': { template: '<section><slot name="title" /><slot /></section>' },
  'a-form': FormStub,
  'a-form-item': { template: '<label><slot /></label>' },
  'a-input': true,
  'a-input-password': true,
  'a-textarea': true,
  'a-avatar': true,
  'a-upload': true,
  'a-button': {
    inheritAttrs: false,
    template: '<button v-bind="$attrs"><slot /></button>'
  }
}

describe('Profile mounted interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUserStore.userInfo.avatar = '/media/avatar.png'
    mockUserStore.updateProfile.mockResolvedValue(mockUserStore.userInfo)
    mockUserStore.getUserInfo.mockResolvedValue(mockUserStore.userInfo)
    changePassword.mockResolvedValue({})
    uploadAvatar.mockResolvedValue({ url: '/media/uploaded-avatar.png' })
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

  it('shows explicit sections and keeps profile save disabled until fields change', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('基本信息')
    expect(wrapper.text()).toContain('修改密码')
    expect(wrapper.find('[data-testid="save-profile"]').attributes('disabled')).toBeDefined()

    wrapper.vm.profileForm.nickname = 'Updated nickname'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="save-profile"]').element.disabled).toBe(false)
    wrapper.unmount()
  })

  it('uses the two-column identity and form layout at the card level', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('.profile-layout').exists()).toBe(true)
    expect(wrapper.find('.profile-identity').exists()).toBe(true)
    expect(wrapper.find('.profile-fields').exists()).toBe(true)
    expect(wrapper.find('.password-layout').exists()).toBe(true)
    expect(wrapper.find('.profile-form-stackable[layout="vertical"]').exists()).toBe(true)
    expect(wrapper.find('[style*="nth-of-type"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('consumes the canonical avatar result from the API upload boundary', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()

    const onSuccess = jest.fn()
    const onError = jest.fn()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await wrapper.vm.handleAvatarUpload({ file, onSuccess, onError })

    expect(uploadAvatar).toHaveBeenCalledWith(file)
    expect(wrapper.vm.profileForm.avatar).toBe('/media/uploaded-avatar.png')
    expect(mockUserStore.userInfo.avatar).toBe('/media/uploaded-avatar.png')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="save-profile"]').element.disabled).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith({ url: '/media/uploaded-avatar.png' })
    expect(onError).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('reports avatar uploads without a URL as failures', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()
    uploadAvatar.mockResolvedValueOnce({ message: '上传失败' })
    const onSuccess = jest.fn()
    const onError = jest.fn()

    await wrapper.vm.handleAvatarUpload({
      file: new File(['avatar'], 'avatar.png', { type: 'image/png' }),
      onSuccess,
      onError
    })

    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(wrapper.vm.profileForm.avatar).toBe('/media/avatar.png')
    wrapper.unmount()
  })

  it('updates the password and clears the fields after success', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.passwordFormRef = {
      validate: jest.fn().mockResolvedValue({ oldPassword: 'OldPass1', newPassword: 'NewPass2' }),
      resetFields: jest.fn()
    }
    wrapper.vm.passwordForm.oldPassword = 'OldPass1'
    wrapper.vm.passwordForm.newPassword = 'NewPass2'
    wrapper.vm.passwordForm.confirmPassword = 'NewPass2'

    await wrapper.vm.handlePasswordChange()

    expect(changePassword).toHaveBeenCalledWith({ oldPassword: 'OldPass1', newPassword: 'NewPass2' })
    expect(wrapper.vm.passwordForm.oldPassword).toBe('')
    expect(wrapper.vm.passwordForm.newPassword).toBe('')
    expect(wrapper.vm.passwordForm.confirmPassword).toBe('')
    wrapper.unmount()
  })

  it('keeps the password fields and reports an update failure', async () => {
    const wrapper = mount(Profile, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.passwordFormRef = {
      validate: jest.fn().mockResolvedValue({ oldPassword: 'OldPass1', newPassword: 'NewPass2' }),
      resetFields: jest.fn()
    }
    wrapper.vm.passwordForm.oldPassword = 'OldPass1'
    wrapper.vm.passwordForm.newPassword = 'NewPass2'
    wrapper.vm.passwordForm.confirmPassword = 'NewPass2'
    changePassword.mockRejectedValueOnce(new Error('原密码错误'))

    await wrapper.vm.handlePasswordChange()

    expect(wrapper.vm.passwordForm.oldPassword).toBe('OldPass1')
    expect(wrapper.vm.passwordForm.newPassword).toBe('NewPass2')
    expect(wrapper.find('.form-error').text()).toContain('原密码错误')
    wrapper.unmount()
  })
})
