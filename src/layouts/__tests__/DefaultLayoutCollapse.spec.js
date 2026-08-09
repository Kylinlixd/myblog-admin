import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import fs from 'node:fs'
import path from 'node:path'

import DefaultLayout from '../DefaultLayout.vue'

const layoutSource = fs.readFileSync(path.join(process.cwd(), 'src/layouts/DefaultLayout.vue'), 'utf8')

var mockRoute
var mockRouter

jest.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter
}))

const passthroughStub = { template: '<div><slot /></div>' }

const globalStubs = {
  'a-layout': passthroughStub,
  'a-layout-sider': {
    props: ['collapsed'],
    template: '<aside class="sider-stub" :data-collapsed="String(collapsed)"><slot /></aside>'
  },
  'a-layout-header': { template: '<header><slot /></header>' },
  'a-layout-content': passthroughStub,
  'a-drawer': {
    name: 'ADrawer',
    props: ['open'],
    template: '<aside class="drawer-stub" :data-open="String(open)"><slot /></aside>'
  },
  'a-dropdown': passthroughStub,
  'a-avatar': { template: '<span><slot /></span>' },
  'a-menu': passthroughStub,
  'a-menu-item': passthroughStub,
  'a-menu-divider': { template: '<hr />' },
  'router-link': {
    props: ['to'],
    emits: ['click'],
    template: '<a :href="to" @click.prevent="$emit(\'click\')"><slot /></a>'
  },
  'router-view': { template: '<div class="router-view-stub" />' },
  transition: passthroughStub
}

const mountLayout = () => mount(DefaultLayout, {
  global: {
    plugins: [createTestingPinia({ stubActions: true })],
    stubs: globalStubs
  }
})

describe('DefaultLayout navigation controls', () => {
  beforeEach(() => {
    mockRoute = reactive({ path: '/dashboard', fullPath: '/dashboard', name: '', meta: {} })
    mockRouter = {
      push: jest.fn((path) => {
        mockRoute.path = path
        mockRoute.fullPath = path
      }),
      replace: jest.fn(),
      go: jest.fn(),
      back: jest.fn()
    }
    window.innerWidth = 768
    localStorage.clear()
  })

  afterEach(() => {
    window.innerWidth = 1024
  })

  it('toggles the mobile menu button aria-expanded state', async () => {
    const wrapper = mountLayout()
    const menuButton = wrapper.find('.icon-button')

    expect(menuButton.attributes('aria-label')).toBe('打开导航')
    expect(menuButton.attributes('aria-expanded')).toBe('false')
    expect(menuButton.attributes('aria-controls')).toBe('admin-mobile-navigation')

    await menuButton.trigger('click')
    expect(menuButton.attributes('aria-label')).toBe('关闭导航')
    expect(menuButton.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.drawer-stub').attributes('data-open')).toBe('true')

    await menuButton.trigger('click')
    expect(menuButton.attributes('aria-expanded')).toBe('false')
  })

  it('closes the mobile drawer after selecting a navigation item', async () => {
    const wrapper = mountLayout()
    const menuButton = wrapper.find('.icon-button')

    await menuButton.trigger('click')
    const navigationItem = wrapper.find('.drawer-stub .nav-item')
    await navigationItem.trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    expect(menuButton.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.drawer-stub').attributes('data-open')).toBe('false')
  })

  it('exposes desktop sidebar state and the active page to assistive technology', async () => {
    window.innerWidth = 1024
    const wrapper = mountLayout()
    const collapseButton = wrapper.find('.sidebar-collapse-control')

    expect(collapseButton.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.nav-item--active').attributes('aria-current')).toBe('page')

    await collapseButton.trigger('click')

    expect(collapseButton.attributes('aria-expanded')).toBe('false')
  })

  it('places the desktop collapse control inside the sidebar brand header', () => {
    window.innerWidth = 1024
    const wrapper = mountLayout()

    expect(wrapper.find('.admin-brand .sidebar-collapse-control').exists()).toBe(true)
    expect(wrapper.find('.admin-sidebar > .sidebar-collapse-control').exists()).toBe(false)
  })

  it('keeps a long desktop navigation inside a full-height scrolling sidebar', () => {
    expect(layoutSource).toContain('height: 100dvh !important')
    expect(layoutSource).toContain('.admin-sidebar .ant-layout-sider-children')
    expect(layoutSource).toContain('.admin-sidebar .admin-navigation')
    expect(layoutSource).toContain('max-height: none')
    expect(layoutSource).toContain('overflow-y: auto')
  })
})
