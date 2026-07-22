import { createBlogApiUrl } from '../blog'

describe('blog API URL builder', () => {
  it.each([
    ['', '/blog/'],
    ['/blog', '/blog/'],
    ['dynamics', '/blog/dynamics/'],
    ['/dynamics/', '/blog/dynamics/'],
    ['/blog/tags', '/blog/tags/']
  ])('normalizes %s to %s', (path, expected) => {
    expect(createBlogApiUrl(path)).toBe(expected)
  })
})
