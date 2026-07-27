import { render, screen } from '@testing-library/vue'

jest.mock('@/utils/apiBaseUrl', () => ({
  buildApiUrl: (url) => url
}))

import ArticleCard from '../ArticleCard.vue'

describe('ArticleCard', () => {
  it('renders the content summary and destination', () => {
    render(ArticleCard, {
      props: {
        article: {
          id: 7,
          title: '构建可靠的 Vue 应用',
          content: '从请求层和状态边界开始整理复杂度。',
          category: { name: '工程实践' },
          created_at: '2026-07-20T10:00:00Z',
          view_count: 32
        }
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          }
        }
      }
    })

    expect(screen.getByText('构建可靠的 Vue 应用')).toBeInTheDocument()
    expect(screen.getByText('工程实践')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/dynamics/7')
  })

  it('renders lazy media and keeps a fallback when an article has no image', async () => {
    const { rerender } = render(ArticleCard, {
      props: {
        article: {
          id: 8,
          title: '带封面的文章',
          content: '正文',
          mediaUrls: [{ url: '/media/cover.png' }]
        }
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          }
        }
      }
    })

    expect(screen.getByRole('img', { name: '带封面的文章' })).toHaveAttribute('loading', 'lazy')
    await rerender({ article: { id: 9, title: '无封面的文章', content: '正文' } })
    expect(document.querySelector('.article-card__media--fallback')).toBeInTheDocument()
  })
})
