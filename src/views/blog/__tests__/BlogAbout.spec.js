import { render, screen } from '@testing-library/vue'
import fs from 'node:fs'
import path from 'node:path'

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

  it('keeps every profile fact visible and able to wrap', () => {
    const { container } = render(BlogAbout)
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogAbout.vue'), 'utf8')

    expect(container.querySelector('.profile-facts')).toBeInTheDocument()
    expect(screen.getByText('可靠的 Web 产品')).toBeVisible()
    expect(screen.getByText('Vue · Django · Java')).toBeVisible()
    expect(screen.getByText('阅读 · 旅行 · 摄影')).toBeVisible()
    expect(source).toContain('overflow-wrap: anywhere')
    expect(source).toContain('.about-hero {')
    expect(source).toContain('grid-template-columns: minmax(0, 1fr) minmax(320px, 360px)')
  })

  it('keeps the contact email readable on the contact banner', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogAbout.vue'), 'utf8')

    expect(source).toContain('.contact-banner a {')
    expect(source).toContain('color: var(--blog-accent-strong)')
    expect(source).toContain('.contact-banner a:hover')
    expect(source).toContain('.contact-banner a:focus-visible')
    expect(source).toContain('padding: 32px')
    expect(source).toContain('.stack-section > div, .stack-groups, .stack-group, .stack-group ul { min-width: 0; }')
  })

  it('uses About-local layout surfaces without cinematic overrides', () => {
    const { container } = render(BlogAbout)

    expect(container.querySelector('.about-hero.cinematic-hero')).not.toBeInTheDocument()
    expect(container.querySelector('.profile-card.cinematic-card')).not.toBeInTheDocument()
    expect(container.querySelector('.principle-card.cinematic-card')).not.toBeInTheDocument()
    expect(container.querySelector('.stack-section.cinematic-card')).not.toBeInTheDocument()
    expect(container.querySelector('.contact-banner.cinematic-card')).not.toBeInTheDocument()
  })
})
