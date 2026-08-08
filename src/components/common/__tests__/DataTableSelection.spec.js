import { mount } from '@vue/test-utils'

import DataTable from '../DataTable.vue'

describe('DataTable row selection', () => {
  it('shows a loading overlay and hides the empty state while loading', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ label: '名称', prop: 'name' }],
        loading: true,
        emptyText: '没有匹配结果'
      }
    })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.table-wrapper').classes()).toContain('is-loading')
    expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    expect(wrapper.find('.loading-overlay').attributes('aria-label')).toBe('正在加载内容')
    expect(wrapper.find('.empty-cell').exists()).toBe(false)
  })

  it('shows the configured empty text after loading finishes', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ label: '名称', prop: 'name' }],
        loading: true,
        emptyText: '没有匹配结果'
      }
    })

    await wrapper.setProps({ loading: false })

    expect(wrapper.find('.table-wrapper').classes()).not.toContain('is-loading')
    expect(wrapper.find('.loading-overlay').exists()).toBe(false)
    expect(wrapper.find('.empty-cell').text()).toContain('没有匹配结果')
  })

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
