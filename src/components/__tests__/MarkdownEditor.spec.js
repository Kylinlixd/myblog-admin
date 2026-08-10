import { mount } from '@vue/test-utils'
import MarkdownEditor from '../MarkdownEditor.vue'

const mockEditorInsert = jest.fn()
const mockEditorFocus = jest.fn()

jest.mock('md-editor-v3', () => ({
  MdEditor: {
    name: 'MdEditor',
    setup(_, { expose }) {
      expose({
        insert: mockEditorInsert,
        focus: mockEditorFocus
      })
      return () => null
    }
  }
}))

describe('MarkdownEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inserts content at the editor selection and exposes focus', () => {
    const wrapper = mount(MarkdownEditor, {
      props: { modelValue: '已有内容' }
    })

    wrapper.vm.insertContent('![图片](/media/a.png)')
    expect(mockEditorInsert).toHaveBeenCalledWith(expect.any(Function))
    expect(mockEditorInsert.mock.calls[0][0]('选中内容')).toEqual({
      targetValue: '![图片](/media/a.png)',
      select: false
    })

    wrapper.vm.focus()
    expect(mockEditorFocus).toHaveBeenCalled()
    wrapper.unmount()
  })
})
