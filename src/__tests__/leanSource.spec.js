import fs from 'node:fs'
import path from 'node:path'

describe('lean source tree', () => {
  it('does not keep orphaned legacy style bundles', () => {
    const obsoleteStyles = ['animations.scss', 'components.scss', 'responsive.scss', 'variables.scss']

    obsoleteStyles.forEach((file) => {
      expect(fs.existsSync(path.join(process.cwd(), 'src/styles', file))).toBe(false)
    })
  })

  it('does not keep components with no runtime consumers', () => {
    const obsoleteComponents = [
      'InspiraUI/SnowfallBg.vue',
      'PageLoading.vue',
      'Skeleton/DynamicListSkeleton.vue',
      'blog/ArticleCard.vue',
      'category/CategoryForm.vue',
      'common/DataFormDialog.vue',
      'tag/TagForm.vue'
    ]

    obsoleteComponents.forEach((file) => {
      expect(fs.existsSync(path.join(process.cwd(), 'src/components', file))).toBe(false)
    })
  })

  it('removes the abandoned mock-data switch', () => {
    const auth = fs.readFileSync(path.join(process.cwd(), 'src/api/auth.js'), 'utf8')
    expect(auth).not.toContain('toggleMockDataMode')
    expect(auth).not.toContain('useMockData')
  })

  it('does not keep obsolete entry points or duplicate public assets', () => {
    const obsoleteFiles = [
      '.vscode/extensions.json',
      'public/sw.js',
      'src/api/index.js',
      'src/assets/default-avatar.png',
      'src/utils/env.js'
    ]

    obsoleteFiles.forEach((file) => {
      expect(fs.existsSync(path.join(process.cwd(), file))).toBe(false)
    })
  })

  it('uses native request IDs and keeps unused Tailwind tooling out', () => {
    const obsoleteFiles = [
      'src/styles/tailwind.css',
      'tailwind.config.js',
      'src/utils/uuid.js'
    ]

    obsoleteFiles.forEach((file) => {
      expect(fs.existsSync(path.join(process.cwd(), file))).toBe(false)
    })

    const client = fs.readFileSync(path.join(process.cwd(), 'src/services/http/client.js'), 'utf8')
    expect(client).toContain('crypto.randomUUID()')
    expect(client).not.toContain("@/utils/uuid")
  })
})
