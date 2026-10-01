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

  it('switches between editor and preview on narrow screens instead of splitting', () => {
    const source = readEditor()

    // 手机上不再用左右分栏：那会让两块各只剩三百多像素
    expect(source).toContain('markdown-editor-panes')
    expect(source).toContain(':preview="!isMobile || mobilePane === \'preview\'"')
    // previewOnly 实测不生效，改用类名 + CSS 保证单栏
    expect(source).toContain(':class="mobilePaneClass"')
    expect(source).toContain('is-mobile-preview')
    expect(source).toMatch(/\.is-mobile-preview :deep\(\.md-editor-input-wrapper\) \{[\s\S]*?display: none/)
    expect(source).not.toMatch(/@media \(max-width: 768px\)[\s\S]*?flex-direction: column/)
  })

  it('starts on the editor pane and switches to a single preview pane (narrow screen)', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    })

    const wrapper = mount(MarkdownEditor, {
      global: {
        stubs: {
          'a-radio-group': { template: '<div><slot /></div>' },
          'a-radio-button': { template: '<div><slot /></div>' }
        }
      }
    })
    await flushPromises()

    // 默认是编辑态：预览关闭
    expect(wrapper.vm.isMobile).toBe(true)
    expect(wrapper.vm.mobilePane).toBe('edit')
    expect(wrapper.findComponent({ name: 'MdEditor' }).props('preview')).toBe(false)
    // 单栏靠类名 + CSS 保证（md-editor 的 previewOnly 实测不生效）
    expect(wrapper.vm.mobilePaneClass).toBe('is-mobile-edit')

    wrapper.vm.mobilePane = 'preview'
    await flushPromises()
    expect(wrapper.findComponent({ name: 'MdEditor' }).props('preview')).toBe(true)
    expect(wrapper.vm.mobilePaneClass).toBe('is-mobile-preview')

    wrapper.unmount()
    window.matchMedia = originalMatchMedia
  })
})
