import { clearEditorDraft, loadEditorDraft, saveEditorDraft } from '../editorDraft'
import fs from 'node:fs'
import path from 'node:path'

describe('editor draft recovery', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a scoped draft without credentials', () => {
    saveEditorDraft('new', {
      title: '草稿',
      content: '正文',
      status: 'draft',
      accessToken: 'must-not-be-stored'
    })

    expect(loadEditorDraft('new')).toMatchObject({
      title: '草稿',
      content: '正文',
      status: 'draft'
    })
    expect(loadEditorDraft('new')).not.toHaveProperty('accessToken')
    clearEditorDraft('new')
    expect(loadEditorDraft('new')).toBeNull()
  })

  it('returns null for corrupt storage', () => {
    localStorage.setItem('kylin:editor-draft:7', '{bad-json')

    expect(loadEditorDraft('7')).toBeNull()
  })

  it('connects recovery, unload protection, and save feedback to the editor', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/dynamics/DynamicEdit.vue'), 'utf8')

    expect(source).toContain('saveEditorDraft')
    expect(source).toContain("addEventListener('beforeunload'")
    expect(source).toContain(':loading="saving"')
  })
})
