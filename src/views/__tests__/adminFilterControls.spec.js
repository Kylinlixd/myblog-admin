import fs from 'node:fs'
import path from 'node:path'

const readView = (file) => fs.readFileSync(
  path.join(process.cwd(), 'src/views', file),
  'utf8'
)

describe('admin filter controls', () => {
  it('lets shared admin filter styles size list-page inputs and selects', () => {
    const listViews = [
      readView('categories/CategoryList.vue'),
      readView('tags/TagList.vue'),
      readView('files/FileList.vue'),
      readView('dynamics/DynamicList.vue')
    ].join('\n')

    expect(listViews).not.toContain('style="width: 120px"')
    expect(listViews).not.toContain('style="width: 140px"')
    expect(listViews).not.toContain('style="width: 240px"')
    expect(listViews).not.toContain('style="min-width: 100px"')
  })

  it('uses the shared admin edit modal style for category and tag dialogs', () => {
    const categoryView = readView('categories/CategoryList.vue')
    const tagView = readView('tags/TagList.vue')
    const adminStyles = fs.readFileSync(
      path.join(process.cwd(), 'src/styles/admin-workspace.scss'),
      'utf8'
    )

    expect(categoryView).toContain('wrap-class-name="admin-edit-modal"')
    expect(categoryView).toContain('v-model:open="dialogVisible"')
    expect(categoryView).toContain('width="600px"')
    expect(tagView).toContain('wrap-class-name="admin-edit-modal"')
    expect(tagView).toContain('width="600px"')
    expect(adminStyles).toContain('.admin-edit-modal .ant-modal-content')
    expect(adminStyles).toContain('.admin-edit-modal .ant-modal-header')
    expect(adminStyles).toContain('.admin-edit-modal .ant-modal-body')
    expect(adminStyles).toContain('.admin-edit-modal .ant-modal-footer')
    expect(adminStyles).toContain('.admin-edit-modal .ant-input')
    expect(adminStyles).toContain('.admin-edit-modal .ant-select-selector')
  })

  it('keeps tag row edit and delete actions on one line like category rows', () => {
    const categoryView = readView('categories/CategoryList.vue')
    const tagView = readView('tags/TagList.vue')

    expect(categoryView).toContain("fixed: 'right'")
    expect(tagView).toContain("fixed: 'right'")
    expect(tagView).toContain('class="table-row-actions"')
    expect(tagView).toContain('.table-row-actions')
    expect(tagView).toContain('flex-wrap: nowrap')
  })
})
