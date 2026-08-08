import request from '@/utils/request'
import { createCategory } from '../category'
import { createTag } from '../tag'

describe('taxonomy API normalization', () => {
  beforeEach(() => jest.restoreAllMocks())

  it.each([
    ['category', createCategory, '/api/categories/'],
    ['tag', createTag, '/api/tags/']
  ])('returns the unwrapped created %s item', async (_type, create, path) => {
    jest.spyOn(request, 'post').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: { id: 7, name: 'Frontend' }
    })

    await expect(create({ name: 'Frontend' })).resolves.toEqual({
      id: 7,
      name: 'Frontend'
    })
    expect(request.post).toHaveBeenCalledWith(path, { name: 'Frontend' })
  })
})
