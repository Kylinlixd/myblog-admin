import { computed, ref, toValue } from 'vue'

export const MIN_COLUMN_WIDTH = 72
const STORAGE_PREFIX = 'blog-admin:table-columns:v1:'

export const columnStorageKey = (tableId) => `${STORAGE_PREFIX}${tableId}`

export const getColumnId = (column, index = 0) =>
  String(column?.key ?? column?.dataIndex ?? column?.prop ?? column?.slot ?? `column-${index}`)

const getDefaultStorage = () => {
  try {
    return typeof globalThis === 'undefined' ? undefined : globalThis.localStorage
  } catch {
    return undefined
  }
}

const numericWidth = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string' || !/^\s*-?(?:\d+\.?\d*|\.\d+)px\s*$/i.test(value)) return undefined
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const persistedWidth = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

export const readColumnWidths = (tableId, storage) => {
  const target = storage === undefined ? getDefaultStorage() : storage
  try {
    const value = JSON.parse(target?.getItem(columnStorageKey(tableId)) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

const writeColumnWidths = (tableId, widths, storage) => {
  try {
    storage?.setItem(columnStorageKey(tableId), JSON.stringify(widths))
  } catch {
    // Storage can be unavailable in private browsing or server-like environments.
  }
}

export function useResizableColumns(tableId, sourceColumns, options = {}) {
  const minimum = Number.isFinite(options.minWidth) ? options.minWidth : MIN_COLUMN_WIDTH
  const storage = options.storage === undefined ? getDefaultStorage() : options.storage
  const widths = ref(readColumnWidths(tableId, storage))

  const columns = computed(() => {
    const source = toValue(sourceColumns)
    return (Array.isArray(source) ? source : []).map((column, index) => {
      const id = getColumnId(column, index)
      const restored = persistedWidth(widths.value[id])
      const fallback = numericWidth(column?.width)
      return {
        ...column,
        key: column?.key ?? id,
        width: restored === undefined ? fallback : Math.max(minimum, restored),
        minWidth: minimum,
        resizable: column?.resizable !== false
      }
    })
  })

  const handleResizeColumn = (width, column, persist = true) => {
    const id = getColumnId(column)
    const parsed = numericWidth(width)
    const nextWidth = Math.max(minimum, parsed === undefined ? minimum : parsed)
    widths.value = { ...widths.value, [id]: nextWidth }
    if (persist) writeColumnWidths(tableId, widths.value, storage)
  }

  return { columns, handleResizeColumn }
}
