import { nextTick, ref } from 'vue'
import {
  MIN_COLUMN_WIDTH,
  columnStorageKey,
  getColumnId,
  readColumnWidths,
  useResizableColumns
} from '../useResizableColumns'

describe('useResizableColumns', () => {
  beforeEach(() => localStorage.clear())

  it('restores widths only for the selected table', () => {
    localStorage.setItem(columnStorageKey('comments'), JSON.stringify({ content: 420 }))
    const { columns } = useResizableColumns('comments', [
      { key: 'content', label: '评论内容', width: '300px' }
    ])
    expect(columns.value[0].width).toBe(420)

    const other = useResizableColumns('access-logs', [
      { key: 'content', label: '行为', width: 180 }
    ])
    expect(other.columns.value[0].width).toBe(180)
  })

  it('clamps resized widths and persists them', async () => {
    const source = ref([{ key: 'serial', width: 60 }])
    const { columns, handleResizeColumn } = useResizableColumns('categories', source)
    handleResizeColumn(30, columns.value[0])
    await nextTick()
    expect(columns.value[0].width).toBe(MIN_COLUMN_WIDTH)
    expect(JSON.parse(localStorage.getItem(columnStorageKey('categories')))).toEqual({ serial: MIN_COLUMN_WIDTH })
  })

  it('preserves defaults below the minimum until resized', () => {
    const { columns } = useResizableColumns('defaults', [
      { dataIndex: 'tiny', width: 40 },
      { prop: 'px', width: '88px' },
      { slot: 'invalid', width: 'auto' }
    ])
    expect(columns.value.map((column) => column.width)).toEqual([40, 88, undefined])
  })

  it('uses stable identity priority and projects reactive source changes', async () => {
    expect(getColumnId({ key: 'k', dataIndex: 'd', prop: 'p', slot: 's' })).toBe('k')
    expect(getColumnId({ dataIndex: 'd', prop: 'p', slot: 's' })).toBe('d')
    expect(getColumnId({ prop: 'p', slot: 's' })).toBe('p')
    expect(getColumnId({ slot: 's' })).toBe('s')
    expect(getColumnId({}, 2)).toBe('column-2')

    const source = ref([{ key: 'a', width: 100 }])
    const { columns, handleResizeColumn } = useResizableColumns('dynamic', source)
    handleResizeColumn(200, columns.value[0])
    source.value = [{ key: 'a', width: 50 }, { key: 'b', width: 120 }]
    await nextTick()
    expect(columns.value.map((column) => column.width)).toEqual([200, 120])
  })

  it('restores only finite numeric persisted widths for current columns', () => {
    localStorage.setItem(columnStorageKey('valid'), JSON.stringify({ a: 100, b: '200', c: null, extra: 400 }))
    const { columns } = useResizableColumns('valid', [
      { key: 'a', width: 80 }, { key: 'b', width: 90 }, { key: 'c', width: 100 }
    ])
    expect(columns.value.map((column) => column.width)).toEqual([100, 90, 100])
  })

  it('falls back when persisted JSON or storage access is unavailable', () => {
    expect(readColumnWidths('broken', { getItem: () => '{' })).toEqual({})
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(() => useResizableColumns('blocked', [{ key: 'name', width: 180 }], { storage: blocked })).not.toThrow()
    const result = useResizableColumns('blocked-write', [{ key: 'name', width: 180 }], { storage: blocked })
    expect(() => result.handleResizeColumn(220, result.columns.value[0])).not.toThrow()
    expect(result.columns.value[0].width).toBe(220)
  })

  it('handles a throwing localStorage getter', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('blocked') } })
    expect(() => useResizableColumns('getter', [{ key: 'name', width: 180 }])).not.toThrow()
    Object.defineProperty(globalThis, 'localStorage', original)
  })
})
