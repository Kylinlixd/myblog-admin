import fs from 'node:fs'
import path from 'node:path'

describe('blog code window feedback', () => {
  it('keeps copied feedback inside a collapsed window', () => {
    const styles = fs.readFileSync(path.join(process.cwd(), 'src/styles/blog-code-window.scss'), 'utf8')

    expect(styles).toContain('.blog-code-window.is-collapsed .blog-code-copy-feedback')
    expect(styles).toContain('right: calc(100% + 6px)')
  })
})
