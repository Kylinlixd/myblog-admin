import { mount } from '@vue/test-utils'

import Pagination from '../Pagination.vue'

describe('Pagination page-size changes', () => {
  it('resets the current page when the page size prop changes', async () => {
    const wrapper = mount(Pagination, {
      props: { total: 100, currentPage: 3, pageSize: 10 },
      global: {
        stubs: {
          'a-pagination': {
            name: 'APagination',
            props: ['current', 'pageSize'],
            emits: ['change', 'showSizeChange', 'update:current'],
            template: `
              <div>
                <button data-page-three @click="$emit('change', 3)">page</button>
                <button data-page-size @click="$emit('showSizeChange', current, 20)">size</button>
              </div>
            `
          }
        }
      }
    })

    const pagination = wrapper.findComponent({ name: 'APagination' })
    await pagination.find('[data-page-three]').trigger('click')
    expect(pagination.props('current')).toBe(3)

    await wrapper.setProps({ pageSize: 20 })

    expect(pagination.props('current')).toBe(1)
  })

  it('emits only one size-change event when Ant Design emits both callbacks', async () => {
    const wrapper = mount(Pagination, {
      props: { total: 100, currentPage: 3, pageSize: 10 },
      global: {
        stubs: {
          'a-pagination': {
            name: 'APagination',
            props: ['current', 'pageSize'],
            emits: ['change', 'showSizeChange', 'update:current'],
            template: `
              <button data-page-size @click="$emit('showSizeChange', current, 20); $emit('change', 1, 20)">
                size
              </button>
            `
          }
        }
      }
    })

    await wrapper.findComponent({ name: 'APagination' }).trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('size-change')).toEqual([[20]])
    expect(wrapper.emitted('current-change')).toBeUndefined()
  })

  it('does not emit current-change when change arrives before showSizeChange', async () => {
    const wrapper = mount(Pagination, {
      props: { total: 100, currentPage: 3, pageSize: 10 },
      global: {
        stubs: {
          'a-pagination': {
            name: 'APagination',
            props: ['current', 'pageSize'],
            emits: ['change', 'showSizeChange', 'update:current'],
            template: `
              <button data-page-size @click="$emit('change', 1, 20); $emit('showSizeChange', current, 20)">
                size
              </button>
            `
          }
        }
      }
    })

    await wrapper.findComponent({ name: 'APagination' }).trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('size-change')).toEqual([[20]])
    expect(wrapper.emitted('current-change')).toBeUndefined()
  })

  it('keeps ordinary current-change pagination events', async () => {
    const wrapper = mount(Pagination, {
      props: { total: 100, currentPage: 3, pageSize: 10 },
      global: {
        stubs: {
          'a-pagination': {
            name: 'APagination',
            props: ['current', 'pageSize'],
            emits: ['change', 'showSizeChange', 'update:current'],
            template: '<button data-page @click="$emit(\'change\', 4)">page</button>'
          }
        }
      }
    })

    await wrapper.findComponent({ name: 'APagination' }).trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('current-change')).toEqual([[4]])
    expect(wrapper.emitted('size-change')).toBeUndefined()
  })
})
