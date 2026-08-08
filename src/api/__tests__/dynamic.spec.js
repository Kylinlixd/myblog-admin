import request from '@/utils/request'
import {
  buildDynamicParams,
  createDynamic,
  getDynamicDetail,
  normalizeDynamicPayload,
  updateDynamic
} from '../dynamic'

describe('dynamic API helpers', () => {
  beforeEach(() => jest.restoreAllMocks())

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

  it.each([
    ['getDynamicDetail', () => getDynamicDetail(42), 'get', '/api/dynamics/42/'],
    ['createDynamic', () => createDynamic({ title: 'New', content: 'Body' }), 'post', '/api/dynamics/'],
    ['updateDynamic', () => updateDynamic(42, { title: 'Updated', content: 'Body' }), 'put', '/api/dynamics/42/']
  ])('returns unwrapped data from %s', async (_name, call, method, path) => {
    jest.spyOn(request, method).mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: { id: 42, title: 'Resolved dynamic' }
    })

    await expect(call()).resolves.toEqual({ id: 42, title: 'Resolved dynamic' })
    expect(request[method]).toHaveBeenCalledWith(
      path,
      ...(method === 'get' ? [] : [expect.any(Object)])
    )
  })
})
