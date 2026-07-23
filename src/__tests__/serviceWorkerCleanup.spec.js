import fs from 'node:fs'
import path from 'node:path'

describe('service worker cleanup', () => {
  it('unregisters legacy service workers so API requests are never cached by a stale proxy', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/main.js'), 'utf8')

    expect(source).toContain('clearLegacyServiceWorkers')
    expect(source).toContain('navigator.serviceWorker.getRegistrations')
    expect(source).toContain('registration.unregister')
  })
})
