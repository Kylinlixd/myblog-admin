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
})
