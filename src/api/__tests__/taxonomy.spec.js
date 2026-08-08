import request from '@/utils/request'
import { createCategory, deleteCategory, updateCategory } from '../category'
import { createTag, deleteTag, updateTag } from '../tag'

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

  it.each([
    ['category', updateCategory, deleteCategory, '/api/categories/7/'],
    ['tag', updateTag, deleteTag, '/api/tags/7/']
  ])('unwraps successful update and delete envelopes for %s', async (_type, update, remove, path) => {
    jest.spyOn(request, 'put').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: { id: 7, name: 'Updated' }
    })
    jest.spyOn(request, 'delete').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: { deleted: true }
    })

    await expect(update(7, { name: 'Updated' })).resolves.toEqual({ id: 7, name: 'Updated' })
    await expect(remove(7)).resolves.toEqual({ deleted: true })
    expect(request.put).toHaveBeenCalledWith(path, { name: 'Updated' })
    expect(request.delete).toHaveBeenCalledWith(path)
  })

  it.each([
    ['category', updateCategory, deleteCategory, '/api/categories/7/'],
    ['tag', updateTag, deleteTag, '/api/tags/7/']
  ])('preserves null success responses for %s update and delete', async (_type, update, remove, path) => {
    jest.spyOn(request, 'put').mockResolvedValueOnce(null)
    jest.spyOn(request, 'delete').mockResolvedValueOnce(null)

    await expect(update(7, { name: 'Updated' })).resolves.toBeNull()
    await expect(remove(7)).resolves.toBeNull()
    expect(request.put).toHaveBeenCalledWith(path, { name: 'Updated' })
    expect(request.delete).toHaveBeenCalledWith(path)
  })
})
