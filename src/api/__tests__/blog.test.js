import { createBlogApiUrl, commentDynamic } from '../blog'
import request from '@/utils/request'

jest.mock('@/utils/request', () => ({
  post: jest.fn()
}))

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

describe('commentDynamic', () => {
  it('passes the optional website through to the public comment API', async () => {
    request.post.mockResolvedValue({ code: 200 })
    await commentDynamic(66, {
      content: '内容', nickname: '访客', email: '', website: 'https://example.com'
    })

    expect(request.post).toHaveBeenCalledWith('/api/blog/comments/', {
      dynamic_id: 66,
      content: '内容',
      nickname: '访客',
      email: '',
      website: 'https://example.com'
    })
  })
})
