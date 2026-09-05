import { mount } from '@vue/test-utils'

import DataTable from '../DataTable.vue'

describe('DataTable row selection', () => {
  beforeEach(() => localStorage.clear())

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

  it('resizes a column with a minimum width and restores it after remount', async () => {
    const props = {
      data: [{ id: 1, name: '示例' }],
      columns: [{ key: 'name', label: '名称', prop: 'name', width: '180px' }],
      columnStorageKey: 'comments'
    }
    const wrapper = mount(DataTable, { props })
    const handle = wrapper.find('.column-resize-handle')
    const header = handle.element.parentElement
    header.getBoundingClientRect = () => ({ width: 180 })

    expect(handle.attributes('role')).toBe('separator')
    expect(handle.attributes('aria-orientation')).toBe('vertical')
    expect(handle.attributes('aria-label')).toContain('名称')

    await handle.trigger('mousedown', { button: 0, clientX: 180 })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 20 }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('72px')
    expect(localStorage.getItem('blog-admin:table-columns:v1:comments')).toBeNull()

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 250 }))
    await wrapper.vm.$nextTick()
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 250 })
    wrapper.unmount()

    const restored = mount(DataTable, { props })
    expect(restored.find('col[data-column-id="name"]').attributes('style')).toContain('250px')
    restored.unmount()
  })

  it('does not persist a drag without a column storage key', async () => {
    const writeStorage = jest.spyOn(Storage.prototype, 'setItem')
    let wrapper

    try {
      wrapper = mount(DataTable, {
        props: {
          columns: [{ key: 'name', label: '名称', prop: 'name', width: 180 }]
        }
      })
      const handle = wrapper.find('.column-resize-handle')
      handle.element.parentElement.getBoundingClientRect = () => ({ width: 180 })

      await handle.trigger('mousedown', { button: 0, clientX: 180 })
      document.dispatchEvent(new MouseEvent('mouseup', { clientX: 240 }))
      await wrapper.vm.$nextTick()

      expect(writeStorage).not.toHaveBeenCalled()
      expect(localStorage.getItem('blog-admin:table-columns:v1:')).toBeNull()
    } finally {
      wrapper?.unmount()
      writeStorage.mockRestore()
    }
  })

  it('does not render a resize handle for a non-resizable column', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [
          { key: 'fixed', label: '固定列', prop: 'fixed', resizable: false },
          { key: 'name', label: '名称', prop: 'name' }
        ]
      }
    })

    expect(wrapper.find('th[data-column-id="fixed"] .column-resize-handle').exists()).toBe(false)
    expect(wrapper.find('th[data-column-id="name"] .column-resize-handle').exists()).toBe(true)
    wrapper.unmount()
  })

  it('resizes with arrow keys, clamps at the minimum, and persists immediately', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'name', label: '名称', prop: 'name', width: 80 }],
        columnStorageKey: 'comments'
      }
    })
    const handle = wrapper.find('.column-resize-handle')

    expect(handle.attributes('tabindex')).toBe('0')
    expect(handle.attributes('aria-valuemin')).toBe('72')
    expect(handle.attributes('aria-valuenow')).toBe('80')
    expect(handle.attributes('aria-valuemax')).toBe('10000')

    await handle.trigger('keydown', { key: 'ArrowLeft' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('72px')
    expect(handle.attributes('aria-valuenow')).toBe('72')
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 72 })

    await handle.trigger('keydown', { key: 'ArrowRight' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('88px')
    expect(handle.attributes('aria-valuenow')).toBe('88')
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 88 })
    wrapper.unmount()
  })

  it('caps keyboard and mouse resizing at the advertised maximum', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'name', label: '名称', prop: 'name', width: 9990 }],
        columnStorageKey: 'comments'
      }
    })
    const handle = wrapper.find('.column-resize-handle')

    await handle.trigger('keydown', { key: 'ArrowRight' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('10000px')
    expect(handle.attributes('aria-valuenow')).toBe('10000')
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 10000 })

    handle.element.parentElement.getBoundingClientRect = () => ({ width: 10000 })
    await handle.trigger('mousedown', { button: 0, clientX: 0 })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5000 }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('10000px')
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 10000 })

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 6000 }))
    await wrapper.vm.$nextTick()
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 10000 })
    wrapper.unmount()
  })

  it('caps restored widths at the advertised maximum before keyboard resizing', async () => {
    localStorage.setItem('blog-admin:table-columns:v1:comments', JSON.stringify({ name: 12000 }))
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'name', label: '名称', prop: 'name', width: 180 }],
        columnStorageKey: 'comments'
      }
    })
    const handle = wrapper.find('.column-resize-handle')

    expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('10000px')
    expect(handle.attributes('aria-valuenow')).toBe('10000')
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 12000 })

    await handle.trigger('keydown', { key: 'ArrowLeft' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('9984px')
    expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 9984 })
    wrapper.unmount()
  })

  it('cleans up an active resize when unmounted', async () => {
    const addListener = jest.spyOn(document, 'addEventListener')
    const removeListener = jest.spyOn(document, 'removeEventListener')
    let wrapper

    try {
      wrapper = mount(DataTable, {
        props: {
          columns: [{ key: 'name', label: '名称', prop: 'name', width: 180 }],
          columnStorageKey: 'comments'
        }
      })
      const handle = wrapper.find('.column-resize-handle')
      handle.element.parentElement.getBoundingClientRect = () => ({ width: 180 })

      await handle.trigger('mousedown', { button: 0, clientX: 180 })
      const mousemoveCallback = addListener.mock.calls.find(([eventName]) => eventName === 'mousemove')?.[1]
      const mouseupCallback = addListener.mock.calls.find(([eventName]) => eventName === 'mouseup')?.[1]
      expect(typeof mousemoveCallback).toBe('function')
      expect(typeof mouseupCallback).toBe('function')

      wrapper.unmount()
      expect(removeListener).toHaveBeenCalledWith('mousemove', mousemoveCallback)
      expect(removeListener).toHaveBeenCalledWith('mouseup', mouseupCallback)

      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 320 }))
      document.dispatchEvent(new MouseEvent('mouseup', { clientX: 320 }))
      expect(localStorage.getItem('blog-admin:table-columns:v1:comments')).toBeNull()
    } finally {
      wrapper?.unmount()
      addListener.mockRestore()
      removeListener.mockRestore()
    }
  })
})
