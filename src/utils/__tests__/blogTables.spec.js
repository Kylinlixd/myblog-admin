import { enhanceBlogTables } from '../blogTables'

const buildTable = () => {
  document.body.innerHTML = `
    <div id="root" class="markdown-body">
      <table>
        <thead><tr><th>类型</th><th>默认动作</th></tr></thead>
        <tbody>
          <tr><td>参数错误（400）</td><td>直接提示并修正, 不重试</td></tr>
          <tr><td>未认证（401）</td><td>刷新会话后重放</td></tr>
        </tbody>
      </table>
    </div>`
  return document.querySelector('#root table')
}

describe('enhanceBlogTables', () => {
  it('wraps tables in a horizontal scroll container', () => {
    const table = buildTable()
    const root = document.querySelector('#root')

    const enhanced = enhanceBlogTables(root)
    expect(enhanced).toHaveLength(1)

    const wrapper = table.closest('.blog-table-wrap')
    expect(wrapper).toBeTruthy()
    // 表格必须在内层滚动容器里：宽表格在卡片内横向滚动，不溢出卡片
    const scroller = wrapper.querySelector('.blog-table-scroll')
    expect(scroller).toBeTruthy()
    expect(table.closest('.blog-table-scroll')).toBe(scroller)
  })

  it('is idempotent across Vue re-renders and keep-alive restores', () => {
    buildTable()
    const root = document.querySelector('#root')

    enhanceBlogTables(root)
    enhanceBlogTables(root)
    expect(document.querySelectorAll('.blog-table-wrap')).toHaveLength(1)
    expect(document.querySelectorAll('.blog-table-scroll')).toHaveLength(1)
    expect(root.querySelectorAll('table[data-blog-table-enhanced="true"]')).toHaveLength(1)
  })
})
