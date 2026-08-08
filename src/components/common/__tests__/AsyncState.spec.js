import { mount } from '@vue/test-utils'

import AsyncState from '../AsyncState.vue'

const globalStubs = {
  'a-button': {
    emits: ['click'],
    template: '<button @click="$emit(\'click\')"><slot /></button>'
  }
}

describe('AsyncState', () => {
  it('renders a loading skeleton without error or empty content', () => {
    const wrapper = mount(AsyncState, {
      props: { loading: true },
      global: { stubs: globalStubs }
    })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.state-skeleton').exists()).toBe(true)
    expect(wrapper.find('.state-skeleton').findAll('span')).toHaveLength(3)
    expect(wrapper.find('h3').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders error and empty states with retry actions', async () => {
    const wrapper = mount(AsyncState, {
      props: { error: '网络暂不可用' },
      global: { stubs: globalStubs }
    })

    expect(wrapper.text()).toContain('内容暂时无法加载')
    expect(wrapper.text()).toContain('网络暂不可用')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)

    await wrapper.setProps({ error: '', empty: true })

    expect(wrapper.text()).toContain('暂时没有内容')
    expect(wrapper.text()).toContain('新的内容正在路上')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(2)
  })
})
