import fs from 'node:fs'
import path from 'node:path'

describe('AsyncState', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/components/common/AsyncState.vue'), 'utf8')

  it('uses a skeleton while loading and keeps retry feedback', () => {
    expect(source).toContain('state-skeleton')
    expect(source).toContain("$emit('retry')")
  })
})
