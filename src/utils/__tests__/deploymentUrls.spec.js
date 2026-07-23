import fs from 'node:fs'
import path from 'node:path'

const readSource = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')

describe('deployment API URLs', () => {
  it('does not hard-code localhost backend URLs in browser code', () => {
    const browserSources = [
      readSource('src/utils/upload.js'),
      readSource('src/views/files/FileList.vue'),
      readSource('src/views/dynamics/DynamicEdit.vue')
    ].join('\n')

    expect(browserSources).not.toContain('localhost:8000')
    expect(browserSources).toContain('getApiBaseUrl')
    expect(browserSources).toContain('buildApiUrl')
  })
})
