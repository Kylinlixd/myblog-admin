import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import CommentList from '../CommentList.vue'
import { approveComment, deleteComment, getCommentList, rejectComment } from '@/api/comment'

jest.mock('@/api/comment', () => ({
  getCommentList: jest.fn(),
  approveComment: jest.fn(),
  rejectComment: jest.fn(),
  deleteComment: jest.fn()
}))

let confirmAction
jest.mock('ant-design-vue', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  },
  Modal: {
    confirm: jest.fn((options) => {
      confirmAction = options.onOk
    })
  }
}))

jest.mock('@ant-design/icons-vue', () => {
  const Icon = { template: '<span />' }
  return {
    CheckOutlined: Icon,
    CloseOutlined: Icon,
    DeleteOutlined: Icon
  }
})

const ButtonStub = {
  inheritAttrs: false,
  props: { loading: Boolean, disabled: Boolean },
  template: '<button v-bind="$attrs" :disabled="disabled" :data-loading="loading ? \'true\' : undefined"><slot /></button>'
}

const globalStubs = {
  PageHeader: true,
  SearchForm: true,
  Pagination: true,
  'a-button': ButtonStub,
  'a-space': { template: '<div><slot /></div>' },
  'a-popconfirm': { template: '<div><slot /></div>' },
  'a-tag': true,
  'a-input': true,
  'a-form-item': true,
  'a-select': true,
  'a-select-option': true
}

const commentsResponse = {
  count: 1,
  results: [{
    id: 1,
    content: 'pending comment',
    nickname: 'Reader',
    email: 'reader@example.com',
    status: 'pending',
    createTime: '2026-08-08T00:00:00Z'
  }]
}

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const mountList = async (response = commentsResponse) => {
  getCommentList.mockResolvedValue(response)
  const wrapper = mount(CommentList, { global: { stubs: globalStubs } })
  await flushPromises()
  return wrapper
}

describe('CommentList mounted states and actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    confirmAction = undefined
    approveComment.mockResolvedValue({})
    rejectComment.mockResolvedValue({})
    deleteComment.mockResolvedValue({})
  })

  it('renders loading, empty, and error states inline', async () => {
    getCommentList.mockResolvedValueOnce({ count: 0, results: [] })
    const emptyWrapper = mount(CommentList, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(emptyWrapper.find('[data-testid="comment-async-state"]').exists()).toBe(true)
    emptyWrapper.unmount()

    getCommentList.mockRejectedValueOnce(new Error('评论加载失败'))
    const errorWrapper = mount(CommentList, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(errorWrapper.find('[data-testid="comment-async-state"]').text()).toContain('评论加载失败')
    errorWrapper.unmount()
  })

  it('shows loading on the affected approve, reject, and delete buttons', async () => {
    const wrapper = await mountList()
    const approveRequest = deferred()
    approveComment.mockReturnValueOnce(approveRequest.promise)
    const approvePromise = wrapper.vm.handleApprove(commentsResponse.results[0])
    await nextTick()
    expect(wrapper.find('[data-testid="approve-comment-1"]').attributes('data-loading')).toBe('true')

    approveRequest.resolve()
    await approvePromise
    await flushPromises()

    const rejectRequest = deferred()
    rejectComment.mockReturnValueOnce(rejectRequest.promise)
    const rejectPromise = wrapper.vm.handleReject(commentsResponse.results[0])
    await nextTick()
    expect(wrapper.find('[data-testid="reject-comment-1"]').attributes('data-loading')).toBe('true')

    rejectRequest.resolve()
    await rejectPromise
    await flushPromises()

    const deleteRequest = deferred()
    deleteComment.mockReturnValueOnce(deleteRequest.promise)
    const deletePromise = wrapper.vm.handleDelete(commentsResponse.results[0])
    await nextTick()
    expect(wrapper.find('[data-testid="delete-comment-1"]').attributes('data-loading')).toBe('true')

    deleteRequest.resolve()
    await deletePromise
    wrapper.unmount()
  })

  it('retains only failed ids after a partial batch delete', async () => {
    const wrapper = await mountList()
    wrapper.vm.selectedCommentIds = [1, 2]
    deleteComment.mockImplementation((id) => id === 2 ? Promise.reject(new Error('failed')) : Promise.resolve({}))

    wrapper.vm.handleBatchDelete()
    await confirmAction()

    expect(wrapper.vm.selectedCommentIds).toEqual([2])
    wrapper.unmount()
  })

  it('wraps long comment content instead of clipping it at the cell edge', async () => {
    const wrapper = await mountList({
      count: 1,
      results: [{ ...commentsResponse.results[0], content: 'a'.repeat(400) }]
    })

    expect(wrapper.find('.content-cell').classes()).toContain('content-cell--wrapping')
    wrapper.unmount()
  })

  it('resets an empty out-of-range page once while keeping the current filters', async () => {
    getCommentList.mockResolvedValueOnce(commentsResponse)
      .mockResolvedValueOnce({ count: 0, results: [] })
      .mockResolvedValueOnce(commentsResponse)
    const wrapper = mount(CommentList, { global: { stubs: globalStubs } })
    await flushPromises()
    wrapper.vm.filterForm.author = 'Reader'
    wrapper.vm.currentPage = 2

    await wrapper.vm.getComments()
    expect(wrapper.vm.currentPage).toBe(1)
    expect(getCommentList).toHaveBeenLastCalledWith({
      page: 1, pageSize: 10, author: 'Reader'
    })
    expect(wrapper.vm.comments).toHaveLength(1)
    wrapper.unmount()
  })

  it('keeps a newer comment response and loading state when requests finish out of order', async () => {
    const first = deferred()
    const second = deferred()
    getCommentList.mockReset()
    getCommentList.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const wrapper = mount(CommentList, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    const newerRequest = wrapper.vm.getComments()
    await wrapper.vm.$nextTick()

    second.resolve({ count: 1, results: [{ ...commentsResponse.results[0], id: 2, content: 'new' }] })
    await newerRequest
    first.resolve({ count: 1, results: [{ ...commentsResponse.results[0], id: 1, content: 'old' }] })
    await flushPromises()

    expect(wrapper.vm.comments).toEqual([{ ...commentsResponse.results[0], id: 2, content: 'new' }])
    expect(wrapper.vm.loading).toBe(false)
    wrapper.unmount()
  })

  it('does not allow batch approval and deletion to run concurrently', async () => {
    const wrapper = await mountList()
    wrapper.vm.selectedCommentIds = [1, 2]
    const approvalRequest = deferred()
    approveComment.mockReturnValue(approvalRequest.promise)

    wrapper.vm.handleBatchApprove()
    const approvalPromise = confirmAction()
    await nextTick()
    expect(wrapper.vm.batchApproving).toBe(true)
    wrapper.vm.handleBatchDelete()

    expect(deleteComment).not.toHaveBeenCalled()
    approvalRequest.resolve()
    await approvalPromise
    wrapper.unmount()
  })
})
