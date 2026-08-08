import { shouldBypassBlogProxy } from '../devProxy'

describe('blog development proxy', () => {
  it('keeps document navigation in the Vue application', () => {
    expect(shouldBypassBlogProxy('text/html,application/xhtml+xml')).toBe(true)
  })

  it('sends API requests to Django', () => {
    expect(shouldBypassBlogProxy('application/json, text/plain, */*')).toBe(false)
  })
})
