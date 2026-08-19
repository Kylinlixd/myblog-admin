import fs from 'node:fs'
import path from 'node:path'

describe('global interaction feedback', () => {
  it('connects router navigation to NProgress', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/main.js'), 'utf8')

    expect(source).toContain("import NProgress from 'nprogress'")
    expect(source).toContain('NProgress.start()')
    expect(source).toContain('NProgress.done()')
  })

  it('clears the in-memory session before redirecting an expired login', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/main.js'), 'utf8')

    expect(source).toContain("window.addEventListener('auth:expired'")
    expect(source).toContain('useUserStore().clearUserData()')
  })

  it('provides touch, focus, and reduced-motion fallbacks', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/global.scss'), 'utf8')

    expect(css).toContain(':focus-visible')
    expect(css).toContain(':active')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('shows a safe-area-aware loading toast with reduced-motion support', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/App.vue'), 'utf8')

    expect(source).toContain('<transition name="loading-toast">')
    expect(source).toContain('class="loading-toast"')
    expect(source).toContain('loading-toast__status')
    expect(source).toContain('env(safe-area-inset-bottom)')
    expect(source).toContain('@media (prefers-reduced-motion: reduce)')
    expect(source).toContain('background: rgb(255 253 248 / 94%)')
    expect(source).toContain('color: var(--blog-text)')
    expect(source).toContain('color: var(--blog-text-muted)')
    expect(source).toContain('#2a7180')
  })
})
