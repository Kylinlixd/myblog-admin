import fs from 'node:fs'
import path from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'

import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { uploadImage } from '@/utils/upload'

jest.mock('md-editor-v3', () => ({
  __esModule: true,
  MdEditor: {
    name: 'MdEditor',
    props: ['modelValue', 'height', 'onUploadImg', 'preview', 'previewOnly'],
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

  it('stacks the live preview under the editor on narrow screens', () => {
    const source = readEditor()

    // 手机上编辑在上、实时预览在下
    expect(source).toMatch(/@media \(max-width: 768px\)[\s\S]*?\.md-editor-content[\s\S]*?flex-direction: column/)
    expect(source).toMatch(/\.md-editor-input-wrapper\) \{[\s\S]*?height: 46vh/)
    // 整块高度交给内容、预览用自然高度，否则预览会被压成三百多像素的一条
    expect(source).toMatch(/\.md-editor\) \{[\s\S]*?height: auto !important/)
    expect(source).toMatch(/\.md-editor-preview-wrapper\) \{[\s\S]*?height: auto !important/)
    // md-editor 默认给预览加了 overflow: hidden，长内容会被裁掉
    expect(source).toMatch(/\.md-editor-preview\) \{[\s\S]*?overflow: visible/)
    expect(source).not.toContain('markdown-editor-panes')
  })
})
