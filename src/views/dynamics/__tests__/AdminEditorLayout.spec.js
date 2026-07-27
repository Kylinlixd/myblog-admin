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
})
