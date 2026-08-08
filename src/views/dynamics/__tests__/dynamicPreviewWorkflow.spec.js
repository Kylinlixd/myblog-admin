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
    const editView = readView('DynamicEdit.vue')

    expect(listView).toContain("name: 'CreateDynamic'")
    expect(listView).not.toContain("localStorage.getItem('accessToken')")
    expect(editView).not.toContain("localStorage.getItem('accessToken')")
    expect(listView).not.toContain('query: { token: accessToken }')
  })

  it('keeps dynamic list search inputs and selects the same size', () => {
    const listView = readView('DynamicList.vue')
    const workspaceStyles = fs.readFileSync(
      path.join(process.cwd(), 'src/styles/admin-workspace.scss'),
      'utf8'
    )

    expect(listView).not.toContain('style="width: 100px"')
    expect(listView).not.toContain('style="width: 120px"')
    expect(listView).not.toContain('style="width: 132px"')
    expect(listView).not.toContain('style="width: 140px"')
    expect(listView).not.toContain('style="width: 200px"')
    expect(listView).not.toContain('dynamic-filter-control')
    expect(workspaceStyles).toContain('--admin-filter-control-height: 36px')
    expect(workspaceStyles).toContain('.admin-filter .ant-input-affix-wrapper .ant-input')
    expect(workspaceStyles).toContain('background: transparent !important')
    expect(listView).toContain('buildOptionText')
    expect(listView).toContain('${value}/页')
  })

  it('allows creating taxonomy directly from the editor', () => {
    const editView = readView('DynamicEdit.vue')

    expect(editView).toContain('openTaxonomyModal(\'category\')')
    expect(editView).toContain('openTaxonomyModal(\'tag\')')
    expect(editView).toContain('createCategory({ name })')
    expect(editView).toContain('createTag({ name })')
    expect(editView).toContain('taxonomyModalVisible')
  })
})
