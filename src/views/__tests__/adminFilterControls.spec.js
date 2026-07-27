import fs from 'node:fs'
import path from 'node:path'

const readView = (file) => fs.readFileSync(
  path.join(process.cwd(), 'src/views', file),
  'utf8'
)

describe('admin filter controls', () => {
  it('uses one shared list-page shell across the admin workspace', () => {
    const listViews = [
      readView('categories/CategoryList.vue'),
      readView('tags/TagList.vue'),
      readView('comments/CommentList.vue'),
      readView('files/FileList.vue'),
      readView('dynamics/DynamicList.vue')
    ]

    listViews.forEach((view) => {
      expect(view).toContain('<PageHeader')
      expect(view).toMatch(/subtitle="[^"]+"/)
    })

    expect(listViews[0]).toContain('class="admin-table-card"')
    expect(listViews[1]).toContain('class="admin-table-card"')
    expect(listViews[2]).toContain('<DataTable')
    expect(listViews[3]).toContain('class="data-card admin-table-card"')
    expect(listViews[4]).toContain('class="data-card admin-table-card"')
  })

  it('keeps public and admin environment copy accurate', () => {
    const homeView = readView('blog/BlogHome.vue')
    const layout = fs.readFileSync(
      path.join(process.cwd(), 'src/layouts/DefaultLayout.vue'),
      'utf8'
    )

    expect(homeView).toContain('>探索技术<')
    expect(homeView).toContain('aria-label="探索技术，无限可能"')
    expect(homeView).not.toContain('持续构建，<br /><em>保持清醒。</em>')
    expect(layout).not.toContain('本地开发')
    expect(layout).not.toContain('API 已代理到 8000')
  })

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
    const adminStyles = fs.readFileSync(
      path.join(process.cwd(), 'src/styles/admin-workspace.scss'),
      'utf8'
    )

    expect(categoryView).toContain("fixed: 'right'")
    expect(tagView).toContain("fixed: 'right'")
    expect(tagView).toContain('class="table-row-actions"')
    expect(adminStyles).toContain('.table-row-actions')
    expect(adminStyles).toContain('flex-wrap: nowrap')
  })
})
