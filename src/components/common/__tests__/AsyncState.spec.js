import fs from 'node:fs'
import path from 'node:path'
import { mount } from '@vue/test-utils'

import AsyncState from '../AsyncState.vue'

describe('AsyncState', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/components/common/AsyncState.vue'), 'utf8')

  it('uses a skeleton while loading and keeps retry feedback', () => {
    expect(source).toContain('state-skeleton')
    expect(source).toContain("$emit('retry')")
  })

  it('offers retry from the error state', async () => {
    const wrapper = mount(AsyncState, {
      props: { error: '网络暂不可用' },
      global: {
        stubs: {
          'a-button': {
            emits: ['click'],
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('offers retry from the empty state', () => {
    const wrapper = mount(AsyncState, {
      props: { empty: true },
      global: {
        stubs: {
          'a-button': {
            emits: ['click'],
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    expect(wrapper.find('button').exists()).toBe(true)
  })
})
