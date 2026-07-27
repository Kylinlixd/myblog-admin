import fs from 'node:fs'
import path from 'node:path'

describe('service worker cleanup', () => {
  it('marks the document after Vue mounts for release health checks', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/main.js'), 'utf8')

    expect(source).toContain("document.documentElement.dataset.appReady = 'true'")
  })

  it('unregisters legacy service workers so API requests are never cached by a stale proxy', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/main.js'), 'utf8')

    expect(source).toContain('clearLegacyServiceWorkers')
    expect(source).toContain('navigator.serviceWorker.getRegistrations')
    expect(source).toContain('registration.unregister')
  })
})
