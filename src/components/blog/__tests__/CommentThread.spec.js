import { mount } from '@vue/test-utils'
import CommentThread from '../CommentThread.vue'

describe('CommentThread client metadata', () => {
  it('renders browser and operating system tags below the nickname', () => {
    const wrapper = mount(CommentThread, {
      props: {
        comment: {
          id: 7,
          nickname: '匿名用户',
          content: '测试评论',
          createTime: '2026-09-12T10:00:00Z',
          client_browser: 'Chrome150.0',
          client_os: 'Windows 10.0',
        },
      },
      global: {
        stubs: {
          UserAvatar: true,
          CommentThread: true,
        },
      },
    })

    const tags = wrapper.findAll('.comment-client-tag')
    expect(tags).toHaveLength(2)
    expect(tags.map((tag) => tag.text())).toEqual(['Chrome150.0', 'Windows 10.0'])
    expect(wrapper.find('.comment-user__identity').text()).toContain('匿名用户')
  })

  it('renders the reply editor slot directly after the current comment action', () => {
    const wrapper = mount(CommentThread, {
      props: {
        comment: { id: 8, content: '评论', createTime: '2026-09-12T10:00:00Z' },
      },
      slots: {
        'reply-editor': '<div class="inline-reply-editor">回复编辑器</div>',
      },
      global: { stubs: { UserAvatar: true, CommentThread: true } },
    })

    const replyButton = wrapper.find('.comment-reply').element
    const editor = wrapper.find('.inline-reply-editor').element
    expect(replyButton.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
