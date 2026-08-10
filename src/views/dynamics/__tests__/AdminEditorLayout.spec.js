import fs from 'node:fs'
import path from 'node:path'

describe('admin editor layout', () => {
  it('uses a focused writing column and sticky settings rail', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/dynamics/DynamicEdit.vue'), 'utf8')

    expect(source).toContain('class="editor-title-field"')
    expect(source).toContain('class="editor-content-field"')
    expect(source).toContain('class="editor-settings-field"')
    expect(source).toContain('grid-template-columns: minmax(0, 1fr) 320px')
  })

  it('places media upload controls before the editor and keeps mobile uploads tappable', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/dynamics/DynamicEdit.vue'), 'utf8')
    const uploadIndex = source.indexOf('media-upload-field')
    const editorIndex = source.indexOf('class="editor-content-field"')

    expect(uploadIndex).toBeGreaterThan(-1)
    expect(uploadIndex).toBeLessThan(editorIndex)
    expect(source).toContain(':open-file-dialog-on-click="true"')
    expect(source).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.edit-form \{[\s\S]*?display: flex;/)
    expect(source).toContain('grid-row: auto;')
  })

  it('hides file metadata only in the mobile selector', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/dynamics/DynamicEdit.vue'), 'utf8')

    expect(source).toContain('.file-name')
    expect(source).toContain('.file-size')
    expect(source).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.file-selector \{[\s\S]*?\.file-preview \{[\s\S]*?margin-bottom: 0;[\s\S]*?\.file-info \{[\s\S]*?display: none;/)
  })
})
