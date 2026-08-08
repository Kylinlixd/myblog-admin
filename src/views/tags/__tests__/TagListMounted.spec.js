import { flushPromises, mount } from '@vue/test-utils'

import TagList from '../TagList.vue'
import { createTag, deleteTag, getTagList, updateTag } from '@/api/tag'

jest.mock('@/api/tag', () => ({
  getTagList: jest.fn(),
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn()
}))

jest.mock('ant-design-vue', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  },
  Popconfirm: { template: '<div><slot /></div>' },
  Modal: { template: '<div><slot /></div>' },
  Form: { template: '<div><slot /></div>' },
  Input: { template: '<div><slot /></div>' },
  Textarea: { template: '<div><slot /></div>' },
  Select: { template: '<div><slot /></div>' }
}))

jest.mock('@ant-design/icons-vue', () => {
  const Icon = { template: '<span />' }
  return {
    PlusOutlined: Icon,
    EditOutlined: Icon,
    DeleteOutlined: Icon,
    SearchOutlined: Icon,
    ReloadOutlined: Icon
  }
})

const globalStubs = {
  PageHeader: true,
  'a-button': {
    inheritAttrs: false,
    props: { loading: Boolean, disabled: Boolean },
    template: '<button v-bind="$attrs" :disabled="disabled" :data-loading="loading ? \'true\' : undefined"><slot /></button>'
  },
  'a-card': true,
  'a-form': true,
  'a-form-item': true,
  'a-input': true,
  'a-textarea': true,
  'a-select': true,
  'a-select-option': true,
  'a-space': { template: '<div><slot /></div>' },
  'a-table': true,
  'a-tag': true,
  'a-popconfirm': { template: '<div><slot /></div>' },
  'a-modal': true
}

describe('TagList mounted states and taxonomy actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getTagList.mockResolvedValue({ count: 0, results: [] })
    createTag.mockResolvedValue({ id: 8, name: 'Vue' })
    updateTag.mockResolvedValue({ id: 8, name: 'Vue 3' })
    deleteTag.mockResolvedValue({})
  })

  it('renders an empty state and retries after an error', async () => {
    getTagList.mockRejectedValueOnce(new Error('标签加载失败'))
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.find('[data-testid="tag-async-state"]').text()).toContain('标签加载失败')
    getTagList.mockResolvedValueOnce({ count: 0, results: [] })
    await wrapper.find('.state-retry').trigger('click')
    await flushPromises()
    expect(getTagList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('creates, edits, and deletes a tag through normalized APIs', async () => {
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.formRef = null

    wrapper.vm.handleAdd()
    wrapper.vm.tagForm.name = 'Vue'
    await wrapper.vm.handleSubmit()
    expect(createTag).toHaveBeenCalledWith(expect.objectContaining({ name: 'Vue' }))

    wrapper.vm.handleEdit({ id: 8, name: 'Vue', description: '', status: 'active' })
    wrapper.vm.tagForm.name = 'Vue 3'
    await wrapper.vm.handleSubmit()
    expect(updateTag).toHaveBeenCalledWith(8, expect.objectContaining({ name: 'Vue 3' }))

    await wrapper.vm.handleDelete({ id: 8 })
    expect(deleteTag).toHaveBeenCalledWith(8)
    wrapper.unmount()
  })

  it('guards the batch delete action while its requests are pending', async () => {
    const wrapper = mount(TagList, { global: { stubs: globalStubs } })
    await flushPromises()
    let resolve
    deleteTag.mockReturnValue(new Promise((res) => { resolve = res }))
    wrapper.vm.selectedRowKeys = [8, 9]

    const firstBatch = wrapper.vm.handleBatchDelete()
    await wrapper.vm.$nextTick()

    const batchButton = wrapper.find('.admin-toolbar button')
    expect(wrapper.vm.batchDeleting).toBe(true)
    expect(batchButton.attributes('disabled')).toBeDefined()
    expect(batchButton.attributes('data-loading')).toBe('true')

    await wrapper.vm.handleBatchDelete()
    expect(deleteTag).toHaveBeenCalledTimes(2)

    resolve({})
    await firstBatch
    expect(wrapper.vm.batchDeleting).toBe(false)
    wrapper.unmount()
  })
})
