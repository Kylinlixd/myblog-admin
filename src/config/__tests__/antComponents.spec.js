import fs from 'node:fs'
import path from 'node:path'

describe('Ant Design component registry', () => {
  it('uses Vite template auto-import instead of a full global component registry', () => {
    const viteConfig = fs.readFileSync(path.join(process.cwd(), 'vite.config.js'), 'utf8')

    expect(viteConfig).toContain("import Components from 'unplugin-vue-components/vite'")
    expect(viteConfig).toContain("AntDesignVueResolver({ importStyle: false })")
    expect(viteConfig).toContain('Components({')
  })

  it('uses Chinese pagination copy for page-size selectors', () => {
    const appView = fs.readFileSync(path.join(process.cwd(), 'src/App.vue'), 'utf8')

    expect(appView).toContain('<a-config-provider :locale="antLocale">')
    expect(appView).toContain("import zhCN from 'ant-design-vue/es/locale/zh_CN'")
    expect(appView).toContain("items_per_page: '/页'")
  })
})
