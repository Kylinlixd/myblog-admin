import { adminMenu } from '../adminMenu'

describe('adminMenu', () => {
  it('contains one unique destination for every management area', () => {
    expect(adminMenu.map((item) => item.path)).toEqual([
      '/dashboard',
      '/dashboard/dynamics',
      '/dashboard/category',
      '/dashboard/tags',
      '/dashboard/comments',
      '/dashboard/files'
    ])
    expect(new Set(adminMenu.map((item) => item.key)).size).toBe(adminMenu.length)
  })
})
