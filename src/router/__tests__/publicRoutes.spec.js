import fs from 'node:fs'
import path from 'node:path'

describe('public routes', () => {
  it('does not expose registration or diagnostics', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/router/index.js'), 'utf8')

    expect(source).not.toContain("path: '/register'")
    expect(source).not.toContain("path: '/debug'")
  })
})
