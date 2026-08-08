import fs from 'node:fs'
import path from 'node:path'

describe('upload authentication boundary', () => {
  it('reuses the shared file API instead of maintaining another HTTP client', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/utils/upload.js'), 'utf8')

    expect(source).toContain("from '@/api/file'")
    expect(source).not.toContain("from 'axios'")
    expect(source).not.toContain("localStorage.getItem('accessToken')")
  })
})
