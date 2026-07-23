import { normalizeCollectionResponse } from '../collections'

describe('collection response normalization', () => {
  it.each([
    [[{ id: 1 }], 1],
    [{ count: 4, results: [{ id: 1 }] }, 4],
    [{ data: { count: 5, results: [{ id: 1 }] } }, 5],
    [{ data: { list: [{ id: 1 }], total: 6 } }, 6],
    [{ data: { total: 8, items: [{ id: 1 }] } }, 8]
  ])('normalizes supported backend shape', (response, count) => {
    expect(normalizeCollectionResponse(response)).toEqual({
      count,
      results: [{ id: 1 }]
    })
  })
})
