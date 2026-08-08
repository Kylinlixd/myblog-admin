import fs from 'node:fs'
import path from 'node:path'

import { antComponents, registerAntComponents } from '../antComponents'

describe('Ant Design component registry', () => {
  it('registers only the components used by global templates', () => {
    const componentNames = antComponents.map((component) => component.name)

    expect(componentNames).toEqual(expect.arrayContaining([
      'AButton',
      'AForm',
      'AInput',
      'ALayout',
      'AModal',
      'ATable'
    ]))
    expect(componentNames).not.toContain('Antd')
  })

  it('registers components without an install hook by name', () => {
    const app = { use: jest.fn(), component: jest.fn() }
    const plainComponent = antComponents.find((component) => !component.install)

    registerAntComponents(app)

    expect(app.component).toHaveBeenCalledWith(plainComponent.name, plainComponent)
  })

  it('uses Chinese pagination copy for page-size selectors', () => {
    const appView = fs.readFileSync(path.join(process.cwd(), 'src/App.vue'), 'utf8')

    expect(appView).toContain('<a-config-provider :locale="antLocale">')
    expect(appView).toContain("import zhCN from 'ant-design-vue/es/locale/zh_CN'")
    expect(appView).toContain("items_per_page: '/页'")
  })
})
