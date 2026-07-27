import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')

describe('admin row action system', () => {
  it('defines one compact semantic style contract', () => {
    const styles = read('src/styles/admin-workspace.scss')

    expect(styles).toContain('.table-row-actions')
    expect(styles).toContain('.row-action--primary')
    expect(styles).toContain('.row-action--danger')
    expect(styles).toContain('min-height: 30px')
    expect(styles).toContain('focus-visible')
  })

  it('uses the contract in every core list view', () => {
    const views = [
      'src/views/dynamics/DynamicList.vue',
      'src/views/categories/CategoryList.vue',
      'src/views/tags/TagList.vue',
      'src/views/files/FileList.vue',
      'src/views/comments/CommentList.vue'
    ].map(read)

    views.forEach((source) => {
      expect(source).toContain('class="table-row-actions"')
      expect(source).toContain('class="row-action')
      expect(source).not.toContain('type="primary" danger size="small"')
    })
  })
})
