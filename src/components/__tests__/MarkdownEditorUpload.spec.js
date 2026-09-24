import fs from 'node:fs'
import path from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'

import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { uploadImage } from '@/utils/upload'

jest.mock('md-editor-v3', () => ({
  __esModule: true,
  MdEditor: {
    name: 'MdEditor',
    props: ['modelValue', 'height', 'onUploadImg'],
    emits: ['update:modelValue'],
    template: '<div class="md-editor-stub" />'
  }
}))

jest.mock('@/utils/upload', () => ({
  uploadImage: jest.fn(),
  uploadFile: jest.fn(),
  checkFileSize: jest.fn(() => true),
  checkFileType: jest.fn(() => true)
}))

jest.mock('ant-design-vue', () => ({
  message: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() }
}))

const readEditor = () => fs.readFileSync(path.join(process.cwd(), 'src/components/MarkdownEditor.vue'), 'utf8')

describe('MarkdownEditor image upload', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uploads through the file library and inserts the returned urls', async () => {
    uploadImage.mockResolvedValueOnce({ id: 21, name: 'shot.png', url: '/api/files/public/abc/', type: 'image' })
    const wrapper = mount(MarkdownEditor)
    const callback = jest.fn()

    await wrapper.vm.handleUploadImg([new File(['x'], 'shot.png', { type: 'image/png' })], callback)
    await flushPromises()

    expect(uploadImage).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(['/api/files/public/abc/'])
    expect(wrapper.emitted('on-image-uploaded')[0][0]).toMatchObject({
      id: 21,
      name: 'shot.png',
      url: '/api/files/public/abc/'
    })
    wrapper.unmount()
  })

  it('reports the failure and inserts nothing when the upload fails', async () => {
    uploadImage.mockRejectedValueOnce(new Error('文件过大'))
    const wrapper = mount(MarkdownEditor)
    const callback = jest.fn()

    await wrapper.vm.handleUploadImg([new File(['x'], 'big.png', { type: 'image/png' })], callback)
    await flushPromises()

    expect(callback).toHaveBeenCalledWith([])
    expect(wrapper.emitted('on-image-uploaded')).toBeUndefined()
    wrapper.unmount()
  })

  it('wires the built-in upload entry to the file library handler', () => {
    const source = readEditor()

    expect(source).toContain(':on-upload-img="handleUploadImg"')
    expect(source).toContain("import { uploadImage } from '@/utils/upload'")
    expect(source).toContain("emit('on-image-uploaded'")
  })

  it('stacks the preview under the editor on narrow screens', () => {
    const source = readEditor()

    expect(source).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.md-editor-content[\s\S]*?flex-direction: column/)
    expect(source).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.md-editor-preview-wrapper[\s\S]*?border-top/)
    expect(source).toContain('.md-editor-resize-operate')
    expect(source).toContain('height: min(760px, 80vh) !important')
  })
})
