import fs from 'node:fs'
import path from 'node:path'

describe('DefaultLayout sidebar collapse control', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/layouts/DefaultLayout.vue'),
    'utf8'
  )

  it('places the desktop collapse control on the sidebar edge', () => {
    const template = source.slice(source.indexOf('<template>'), source.indexOf('</template>'))
    const sidebarMarkup = template.slice(
      template.indexOf('<a-layout-sider'),
      template.indexOf('</a-layout-sider>')
    )
    const headerMarkup = template.slice(
      template.indexOf('<a-layout-header'),
      template.indexOf('</a-layout-header>')
    )

    expect(source).toContain('sidebar-collapse-control')
    expect(sidebarMarkup).toContain('@click="toggleSidebar"')
    expect(headerMarkup).not.toContain('折叠导航')
    expect(headerMarkup).toContain('打开导航')
  })
})
