import fs from 'node:fs'
import path from 'node:path'

describe('asset deployment rules', () => {
  it('keeps missing JavaScript chunks from falling back to index.html', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'ops/nginx/myblog-admin.conf'),
      'utf8'
    )

    expect(source).toContain('location ^~ /assets/')
    expect(source).toContain('try_files $uri =404;')
    expect(source).toContain('Cache-Control "public, max-age=31536000, immutable"')
    expect(source).toContain('gzip on;')
    expect(source).toContain('gzip_comp_level 5;')
    expect(source).toContain('gzip_types')
    expect(source).toContain('application/javascript')
  })
})
