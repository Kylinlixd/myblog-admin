import { mount } from '@vue/test-utils'
import CommentComposer from '../CommentComposer.vue'

describe('CommentComposer', () => {
  it('shows optional identity fields and emits all values after content validation', async () => {
    const wrapper = mount(CommentComposer)
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('访客')
    await inputs[1].setValue('visitor@example.com')
    await inputs[2].setValue('https://example.com')
    await wrapper.find('textarea').setValue('很有帮助')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      nickname: '访客', email: 'visitor@example.com', website: 'https://example.com', content: '很有帮助'
    })
    expect(wrapper.text()).toContain('可选')
  })

  it('does not emit empty comments and explains the validation state', async () => {
    const wrapper = mount(CommentComposer)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').text()).toContain('请输入评论内容')
  })
})
