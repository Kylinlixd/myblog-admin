import fs from 'node:fs'
import path from 'node:path'

describe('admin workspace styles', () => {
  it('defines the shared admin content and list surfaces', () => {
    const stylesheet = fs.readFileSync(
      path.join(process.cwd(), 'src/styles/admin-workspace.scss'),
      'utf8'
    )

    expect(stylesheet).toContain('.workspace-content')
    expect(stylesheet).toContain('width: min(100%, 1660px)')
    expect(stylesheet).toContain('.admin-page')
    expect(stylesheet).toContain('.admin-filter')
    expect(stylesheet).toContain('.admin-toolbar')
    expect(stylesheet).toContain('.admin-table-card')
    expect(stylesheet).toContain('--admin-table-min-width')
  expect(stylesheet).toContain('overflow-x: auto')
  expect(stylesheet).toContain('overflow-x: hidden')
  })

  it('standardizes admin filter input and select control sizes', () => {
    const stylesheet = fs.readFileSync(
      path.join(process.cwd(), 'src/styles/admin-workspace.scss'),
      'utf8'
    )

    expect(stylesheet).toContain('--admin-filter-control-width: 140px')
    expect(stylesheet).toContain('--admin-filter-control-height: 36px')
    expect(stylesheet).toContain('width: var(--admin-filter-control-width) !important')
    expect(stylesheet).toContain('.admin-filter .ant-input-affix-wrapper .ant-input')
    expect(stylesheet).toContain('background: transparent !important')
  })

  it('keeps wrapped admin filters compact below the sidebar breakpoint', () => {
    const stylesheet = fs.readFileSync(
      path.join(process.cwd(), 'src/styles/admin-workspace.scss'),
      'utf8'
    )

    expect(stylesheet).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(stylesheet).toContain('flex: 0 0 auto')
    expect(stylesheet).toContain('.admin-filter .search-form-right .ant-form-item:last-child')
  })
})
