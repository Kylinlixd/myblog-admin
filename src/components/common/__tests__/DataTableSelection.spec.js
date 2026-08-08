import { mount } from '@vue/test-utils'

import DataTable from '../DataTable.vue'

describe('DataTable row selection', () => {
  it('selects every visible row from the header checkbox', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [{ id: 1, name: '一' }, { id: 2, name: '二' }],
        columns: [{ label: '名称', prop: 'name' }],
        selectable: true,
        selectedRowKeys: []
      }
    })

    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(3)
    await wrapper.find('thead input[type="checkbox"]').setValue(true)

    expect(wrapper.emitted('selection-change').at(-1)[0]).toEqual([1, 2])
  })

  it('emits an updated key list when one row changes', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [{ id: 1, name: '一' }, { id: 2, name: '二' }],
        columns: [{ label: '名称', prop: 'name' }],
        selectable: true,
        selectedRowKeys: [1]
      }
    })

    await wrapper.findAll('tbody input[type="checkbox"]')[1].setValue(true)
    expect(wrapper.emitted('selection-change').at(-1)[0]).toEqual([1, 2])
  })

  it('selects only the current page while preserving off-page selections', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [{ id: 1, name: '一' }, { id: 2, name: '二' }],
        columns: [{ label: '名称', prop: 'name' }],
        selectable: true,
        selectedRowKeys: [99]
      }
    })

    await wrapper.find('thead input[type="checkbox"]').setValue(true)
    expect(new Set(wrapper.emitted('selection-change').at(-1)[0])).toEqual(new Set([1, 2, 99]))

    await wrapper.find('thead input[type="checkbox"]').setValue(false)
    expect(wrapper.emitted('selection-change').at(-1)[0]).toEqual([99])
  })
})
