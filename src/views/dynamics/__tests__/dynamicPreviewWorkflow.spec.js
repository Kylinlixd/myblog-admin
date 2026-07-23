import fs from 'node:fs'
import path from 'node:path'

const readView = (file) => fs.readFileSync(
  path.join(process.cwd(), 'src/views/dynamics', file),
  'utf8'
)

describe('dynamic preview workflow', () => {
  it('routes edit-page draft previews through the existing preview page', () => {
    const editView = readView('DynamicEdit.vue')
    const previewView = readView('DynamicPreview.vue')
    const router = fs.readFileSync(
      path.join(process.cwd(), 'src/router/index.js'),
      'utf8'
    )

    expect(editView).toContain("name: 'PreviewDynamic'")
    expect(editView).toContain("params: { id: 'draft' }")
    expect(previewView).toContain("route.params.id === 'draft'")
    expect(previewView).toContain("localStorage.getItem('dynamicPreview')")
    expect(router).toContain("path: 'dynamics/preview'")
    expect(router).toContain("params: { id: 'draft' }")
  })

  it('keeps the file selector search controls compact', () => {
    const editView = readView('DynamicEdit.vue')

    expect(editView).toContain('class="file-search"')
    expect(editView).toContain('style="width: 280px; max-width: 100%"')
    expect(editView).toContain('.file-selector-header')
    expect(editView).toContain('max-width: 280px')
  })

  it('uses the canonical authenticated route for creating dynamics', () => {
    const listView = readView('DynamicList.vue')

    expect(listView).toContain("name: 'CreateDynamic'")
    expect(listView).not.toContain("localStorage.getItem('accessToken')")
    expect(listView).not.toContain('query: { token: accessToken }')
  })

  it('keeps title and content search inputs compact on the dynamic list', () => {
    const listView = readView('DynamicList.vue')

    expect(listView.match(/class="dynamic-filter-input"/g) || []).toHaveLength(2)
    expect(listView).toContain('style="width: 132px"')
  })
})
