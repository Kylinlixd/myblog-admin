import { getCommentList } from '../comment'
import request from '@/utils/request'

describe('comment API normalization', () => {
  beforeEach(() => jest.restoreAllMocks())

  it.each([
    [{ data: { list: [{ id: 1 }], total: 4 } }, 4],
    [{ data: { items: [{ id: 2 }], total: 5 } }, 5],
    [{ data: { results: [{ id: 3 }], count: 6 } }, 6],
    [[{ id: 4 }], 1]
  ])('normalizes backend collection payloads to count/results', async (payload, count) => {
    jest.spyOn(request, 'get').mockResolvedValueOnce(payload)

    await expect(getCommentList()).resolves.toEqual({
      count,
      results: [payload.data?.list?.[0] || payload.data?.items?.[0] || payload.data?.results?.[0] || payload[0]]
    })
  })
})
