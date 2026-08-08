import { buildDynamicParams, normalizeDynamicPayload } from '../dynamic'

describe('dynamic API helpers', () => {
  it('serializes repeated tag IDs using the backend field name', () => {
    const params = buildDynamicParams({ page: 2, tagIds: [3, 7], title: '' })

    expect(params.toString()).toBe('page=2&tagIds=3&tagIds=7&sort=createdAt%3Adesc')
  })

  it('keeps only the writable content fields', () => {
    expect(normalizeDynamicPayload({
      id: 10,
      title: 'Article',
      content: 'Body',
      type: 'text',
      status: 'published',
      mediaUrls: null,
      categoryId: 2,
      tags: [4],
      createdAt: 'ignored'
    })).toEqual({
      title: 'Article',
      content: 'Body',
      type: 'text',
      status: 'published',
      mediaUrls: [],
      categoryId: 2,
      tags: [4]
    })
  })
})
