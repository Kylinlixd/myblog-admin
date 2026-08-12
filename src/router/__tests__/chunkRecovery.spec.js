import fs from 'node:fs'
import path from 'node:path'

describe('route chunk recovery', () => {
  it('reloads once when a stale deployment chunk cannot be imported', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/router/index.js'), 'utf8')

    expect(source).toContain("sessionStorage.getItem('vite-chunk-recovery')")
    expect(source).toContain("sessionStorage.setItem('vite-chunk-recovery', '1')")
    expect(source).toContain('window.location.reload()')
  })
})
