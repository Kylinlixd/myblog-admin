import { render, screen } from '@testing-library/vue'

import BlogAbout from '../BlogAbout.vue'

describe('BlogAbout', () => {
  it('presents the author story and safe contact links', () => {
    render(BlogAbout)

    expect(screen.getByRole('heading', { name: '持续学习，也持续输出。' })).toBeInTheDocument()
    expect(screen.getByText(/把开发经验整理成能复用的方法/)).toBeInTheDocument()

    const githubLink = screen.getByRole('link', { name: /GitHub/ })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/Kylinlixd')
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
