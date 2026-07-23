import { createBlogApiUrl } from '../blog'

describe('blog API URL builder', () => {
  it.each([
    ['', '/api/blog/'],
    ['/api/blog', '/api/blog/'],
    ['dynamics', '/api/blog/dynamics/'],
    ['/dynamics/', '/api/blog/dynamics/'],
    ['/blog/tags', '/api/blog/tags/'],
    ['/api/blog/tags', '/api/blog/tags/']
  ])('normalizes %s to %s', (path, expected) => {
    expect(createBlogApiUrl(path)).toBe(expected)
  })
})
