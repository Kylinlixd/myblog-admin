import { enhanceBlogTables, tableToTsv } from '../blogTables'

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

describe('tableToTsv', () => {
  it('flattens cell whitespace so tabs and newlines cannot corrupt columns', () => {
    const table = document.createElement('table')
    table.innerHTML = '<tr><td>a\tb</td><td>c\nd</td></tr><tr><td>e</td><td>f</td></tr>'
    expect(tableToTsv(table)).toBe('a b\tc d\ne\tf')
  })
})

describe('enhanceBlogTables', () => {
  it('wraps tables with a hover copy control that copies TSV', async () => {
    const table = buildTable()
    const root = document.querySelector('#root')
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    const enhanced = enhanceBlogTables(root)
    expect(enhanced).toHaveLength(1)

    const wrapper = table.closest('.blog-table-wrap')
    expect(wrapper).toBeTruthy()
    expect(wrapper.querySelector('.blog-table-copy')).toBeTruthy()
    expect(wrapper.querySelector('.blog-table-copy-feedback').textContent).toBe('已复制')

    await wrapper.querySelector('.blog-table-copy').click()
    expect(writeText).toHaveBeenCalledWith('类型\t默认动作\n参数错误（400）\t直接提示并修正, 不重试\n未认证（401）\t刷新会话后重放')
  })

  it('is idempotent across Vue re-renders and keep-alive restores', () => {
    buildTable()
    const root = document.querySelector('#root')

    enhanceBlogTables(root)
    enhanceBlogTables(root)
    expect(document.querySelectorAll('.blog-table-wrap')).toHaveLength(1)
    expect(root.querySelectorAll('table[data-blog-table-enhanced="true"]')).toHaveLength(1)
  })

  it('reports failure state when the clipboard rejects', async () => {
    buildTable()
    const root = document.querySelector('#root')
    const writeText = jest.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    enhanceBlogTables(root)
    await document.querySelector('.blog-table-copy').click()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.querySelector('.blog-table-copy-feedback').textContent).toBe('复制失败')
  })
})
