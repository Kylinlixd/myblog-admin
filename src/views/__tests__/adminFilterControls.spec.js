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
})
