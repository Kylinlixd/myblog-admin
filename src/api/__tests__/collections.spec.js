import { normalizeCollectionResponse } from '../collections'

describe('collection response normalization', () => {
  it.each([
    [[{ id: 1 }], 1],
    [{ count: 4, results: [{ id: 1 }] }, 4],
    [{ data: { total: 8, items: [{ id: 1 }] } }, 8]
  ])('normalizes supported backend shape', (response, count) => {
    expect(normalizeCollectionResponse(response)).toEqual({
      count,
      results: [{ id: 1 }]
    })
  })
})
