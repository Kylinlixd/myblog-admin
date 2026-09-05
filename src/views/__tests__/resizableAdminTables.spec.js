import fs from 'node:fs'
import path from 'node:path'

const readView = (file) => fs.readFileSync(
  path.join(process.cwd(), 'src/views', file),
  'utf8'
)

const antTableViews = [
  ['dynamics/DynamicList.vue', 'dynamics'],
  ['files/FileList.vue', 'files'],
  ['categories/CategoryList.vue', 'categories'],
  ['tags/TagList.vue', 'tags']
]

describe('resizable admin tables', () => {
  it.each(antTableViews)('%s connects its Ant table to persisted resizable columns', (file, tableId) => {
    const source = readView(file)

    expect(source).toContain(':columns="resizableColumns"')
    expect(source).toContain('@resizeColumn="handleResizeColumn"')
    expect(source).toMatch(/import\s+\{\s*useResizableColumns\s*\}\s+from\s+['"]@\/composables\/useResizableColumns['"]/)
    expect(source).toMatch(new RegExp(`useResizableColumns\\(\\s*['"]${tableId}['"]`))
  })

  it('shares dynamic column widths between desktop and mobile configurations', () => {
    const source = readView('dynamics/DynamicList.vue')

    expect(source).toMatch(/const\s+activeColumns\s*=\s*computed\(\(\)\s*=>\s*responsive\.value\s*\?\s*columnsForMobile\s*:\s*columns\)/)
    expect(source).toMatch(/useResizableColumns\(\s*['"]dynamics['"]\s*,\s*activeColumns\s*\)/)
  })

  it.each([
    ['comments/CommentList.vue', 'comments', ['serialNo', 'content', 'nickname', 'email', 'status', 'createTime', 'actions']],
    ['accessLogs/AccessLogList.vue', 'access-logs', ['ip', 'geo', 'behavior', 'risk', 'last_seen', 'rules', 'action']]
  ])('%s supplies a stable storage key and stable column identities', (file, storageKey, columnKeys) => {
    const source = readView(file)

    expect(source).toMatch(new RegExp(`column-storage-key\\s*=\\s*['"]${storageKey}['"]`))
    columnKeys.forEach((key) => {
      expect(source).toMatch(new RegExp(`key\\s*:\\s*['"]${key}['"]`))
    })
  })
})
