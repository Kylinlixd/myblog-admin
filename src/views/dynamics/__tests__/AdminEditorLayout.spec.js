import fs from 'node:fs'
import path from 'node:path'

const readEditor = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/views/dynamics/DynamicEdit.vue'), 'utf8')

describe('admin editor layout', () => {
  it('tiles the metadata modules above a full-width writing surface', () => {
    const source = readEditor()

    expect(source).toContain('class="editor-tiles"')
    expect(source).toContain('class="editor-title-field editor-tile"')
    expect(source).toContain('class="editor-settings-field editor-tile"')
    expect(source).toContain('class="editor-settings-field media-upload-field editor-tile editor-tile--wide"')
    expect(source).toContain('class="editor-content-field"')

    // 平铺区必须排在正文编辑器之前，编辑器独占整宽而不是右侧留一条设置栏
    expect(source.indexOf('class="editor-tiles"')).toBeLessThan(
      source.indexOf('class="editor-content-field"')
    )
    expect(source).not.toContain('grid-template-columns: minmax(0, 1fr) 320px')
    expect(source).toMatch(
      /\.editor-tiles\s*\{[\s\S]*?grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)/
    )
    // 窄屏两列、手机单列，平铺区始终排在编辑器上方
    expect(source).toMatch(
      /@media \(max-width: 1080px\)[\s\S]*?\.editor-tiles\s*\{[\s\S]*?repeat\(6, minmax\(0, 1fr\)\)/
    )
    expect(source).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.editor-tiles\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
    expect(source).toMatch(/\.editor-tile--wide\s*\{[\s\S]*?grid-column: 1 \/ -1/)
  })

  it('places media upload controls before the editor and keeps mobile uploads tappable', () => {
    const source = readEditor()
    const uploadIndex = source.indexOf('media-upload-field')
    const editorIndex = source.indexOf('class="editor-content-field"')

    expect(uploadIndex).toBeGreaterThan(-1)
    expect(uploadIndex).toBeLessThan(editorIndex)
    expect(source).toContain(':open-file-dialog-on-click="true"')
    expect(source).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.edit-form \{[\s\S]*?display: flex;/)
    expect(source).toContain('grid-row: auto;')
  })

  it('hides file metadata only in the mobile selector', () => {
    const source = readEditor()

    expect(source).toContain('.file-name')
    expect(source).toContain('.file-size')
    expect(source).toMatch(/@media \(max-width: 640px\)[\s\S]*?:global\(\.file-selector \.file-preview\)[\s\S]*?margin-bottom: 0;[\s\S]*?:global\(\.file-selector \.file-info\)[\s\S]*?display: none;/)
  })

  it('keeps teleported file selector styles outside the editor scope', () => {
    const source = readEditor()

    expect(source).toContain(':global(.file-selector .file-preview)')
    expect(source).toContain(':global(.file-selector .file-info)')
  })

  it('separates the file search bar from the result grid', () => {
    const source = readEditor()

    // 选择器弹窗被 teleport 到 body，样式块必须放在 .dynamic-edit 之外
    expect(source).toMatch(/\n\.file-selector\s*\{[\s\S]*?\.file-selector-header\s*\{[\s\S]*?padding-bottom: 18px/)
    expect(source).toMatch(/\n\.file-selector\s*\{[\s\S]*?\.file-selector-header\s*\{[\s\S]*?border-bottom: 1px solid #eef1f5/)
    expect(source).toMatch(/\n\.file-selector\s*\{[\s\S]*?\.file-list\s*\{[\s\S]*?margin: 20px 0 0/)
    expect(source).not.toMatch(/\.dynamic-edit \{[\s\S]*?\n  \.file-selector \{/)
    // :global(容器) { 子选择器 } 的嵌套写法会被构建管线压平成同一个选择器，禁止再出现
    expect(source).not.toContain(':global(.file-selector) {')
  })

  it('offers page navigation and explains both file picker actions', () => {
    const source = readEditor()

    expect(source).toContain('class="file-pagination"')
    expect(source).toContain('@change="handleFilePageChange"')
    expect(source).toContain('仅关联媒体：')
    expect(source).toContain('插入正文：')
    expect(source).toContain('@click="handleFileConfirm"')
    expect(source).toContain('@click="handleFileInsert"')
  })
})
