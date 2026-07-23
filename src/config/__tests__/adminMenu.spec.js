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

  it('groups menu items with descriptions for the refreshed admin shell', () => {
    expect(adminMenu.map((item) => item.group)).toEqual([
      'overview',
      'content',
      'content',
      'content',
      'community',
      'system'
    ])
    expect(adminMenu.every((item) => item.description && item.groupLabel)).toBe(true)
  })
})
