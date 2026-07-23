import fs from 'node:fs'
import path from 'node:path'

describe('admin workspace styles', () => {
  it('defines the shared admin content and list surfaces', () => {
    const stylesheet = fs.readFileSync(
      path.join(process.cwd(), 'src/styles/admin-workspace.scss'),
      'utf8'
    )

    expect(stylesheet).toContain('.workspace-content')
    expect(stylesheet).toContain('.admin-page')
    expect(stylesheet).toContain('.admin-filter')
    expect(stylesheet).toContain('.admin-toolbar')
    expect(stylesheet).toContain('.admin-table-card')
    expect(stylesheet).toContain('--admin-table-min-width')
    expect(stylesheet).toContain('overflow-x: auto')
  })
})
