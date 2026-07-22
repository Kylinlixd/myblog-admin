import { render, screen } from '@testing-library/vue'

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
})
