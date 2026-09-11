import { collectArticleHeadings, getActiveHeadingId } from '../articleNavigation'

describe('article navigation', () => {
  it('collects h2/h3/h4 headings with stable readable ids and levels', () => {
    document.body.innerHTML = '<article><h2>安装与配置</h2><h3>安装与配置</h3><h4>完成</h4></article>'
    const items = collectArticleHeadings(document.querySelector('article'))

    expect(items.map(({ level }) => level)).toEqual([2, 3, 4])
    expect(items.map(({ id }) => id)).toEqual([
      'article-heading-安装与配置',
      'article-heading-安装与配置-2',
      'article-heading-完成'
    ])
    expect(document.querySelectorAll('[id^="article-heading-"]')).toHaveLength(3)
  })

  it('uses the last heading above the reading offset as active section', () => {
    const first = { id: 'first', element: { getBoundingClientRect: () => ({ top: 80 }) } }
    const second = { id: 'second', element: { getBoundingClientRect: () => ({ top: 180 }) } }
    expect(getActiveHeadingId([first, second], 120)).toBe('first')
    expect(getActiveHeadingId([first, second], 220)).toBe('second')
  })
})
