# Resizable Admin Table Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add minimum-constrained, locally persisted column resizing to all six admin list tables and publish the verified build.

**Architecture:** A focused Vue composable owns column identity, width normalization, state restoration, and guarded `localStorage` writes. Ant Design Vue tables consume its reactive columns through the library's native `resizable`/`resizeColumn` API, while the existing `DataTable` renders its own header handles and delegates width state to the same composable.

**Tech Stack:** Vue 3 Composition API, Ant Design Vue 4.2, Jest/jsdom, Vue Test Utils, Vite, Git, Nginx immutable releases

---

## File map

- Create `src/composables/useResizableColumns.js`: shared column identity, width validation, persistence, and reactive column projection.
- Create `src/composables/__tests__/useResizableColumns.spec.js`: pure and reactive behavior tests for storage restore, isolation, clamping, and failures.
- Modify `src/components/common/DataTable.vue`: render column widths and mouse resize handles, clean up document listeners, and accept a table storage identifier.
- Modify `src/components/common/__tests__/DataTableSelection.spec.js`: cover handle rendering, drag updates, persistence, and minimum width.
- Modify `src/views/dynamics/DynamicList.vue`, `src/views/files/FileList.vue`, `src/views/categories/CategoryList.vue`, and `src/views/tags/TagList.vue`: connect Ant Design Vue native resizing to the shared composable.
- Modify `src/views/comments/CommentList.vue` and `src/views/accessLogs/AccessLogList.vue`: give each `DataTable` a stable persistence identifier.
- Create `src/views/__tests__/resizableAdminTables.spec.js`: ensure all six list views retain their required resize integration.

### Task 1: Shared persistent column-width state

**Files:**
- Create: `src/composables/useResizableColumns.js`
- Create: `src/composables/__tests__/useResizableColumns.spec.js`

- [ ] **Step 1: Write failing tests for restore, isolation, minimum width, and storage failures**

Add tests that call the intended API directly:

```js
import { nextTick, ref } from 'vue'
import {
  MIN_COLUMN_WIDTH,
  columnStorageKey,
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

  it('falls back when persisted JSON or storage access is unavailable', () => {
    expect(readColumnWidths('broken', { getItem: () => '{' })).toEqual({})
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(() => useResizableColumns('blocked', [{ key: 'name', width: 180 }], { storage: blocked })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand src/composables/__tests__/useResizableColumns.spec.js`

Expected: FAIL because `useResizableColumns.js` does not exist.

- [ ] **Step 3: Implement the shared composable**

Implement these exports and behavior:

```js
import { computed, ref, toValue } from 'vue'

export const MIN_COLUMN_WIDTH = 72
const STORAGE_PREFIX = 'blog-admin:table-columns:v1:'

export const columnStorageKey = (tableId) => `${STORAGE_PREFIX}${tableId}`

export const getColumnId = (column, index = 0) =>
  String(column.key ?? column.dataIndex ?? column.prop ?? column.slot ?? `column-${index}`)

const numericWidth = (value) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const readColumnWidths = (tableId, storage = globalThis.localStorage) => {
  try {
    const value = JSON.parse(storage?.getItem(columnStorageKey(tableId)) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

const writeColumnWidths = (tableId, widths, storage) => {
  try {
    storage?.setItem(columnStorageKey(tableId), JSON.stringify(widths))
  } catch {
    // Browser privacy settings may disable localStorage; in-memory resizing still works.
  }
}

export function useResizableColumns(tableId, sourceColumns, options = {}) {
  const minimum = options.minWidth ?? MIN_COLUMN_WIDTH
  const storage = options.storage ?? globalThis.localStorage
  const widths = ref(readColumnWidths(tableId, storage))
  const columns = computed(() => toValue(sourceColumns).map((column, index) => {
    const id = getColumnId(column, index)
    const restored = numericWidth(widths.value[id])
    const fallback = numericWidth(column.width)
    return {
      ...column,
      key: column.key ?? id,
      width: restored === undefined ? fallback : Math.max(minimum, restored),
      minWidth: minimum,
      resizable: column.resizable !== false
    }
  }))

  const handleResizeColumn = (width, column, persist = true) => {
    const id = getColumnId(column)
    const nextWidth = Math.max(minimum, numericWidth(width) ?? minimum)
    widths.value = { ...widths.value, [id]: nextWidth }
    if (persist) writeColumnWidths(tableId, widths.value, storage)
  }

  return { columns, handleResizeColumn }
}
```

Guard access to `globalThis.localStorage` so server-like or restricted environments also fall back cleanly; do not assume the property getter always succeeds.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --runInBand src/composables/__tests__/useResizableColumns.spec.js`

Expected: all tests PASS.

- [ ] **Step 5: Commit the shared state unit**

```bash
git add src/composables/useResizableColumns.js src/composables/__tests__/useResizableColumns.spec.js
git commit -m "feat: persist admin table column widths"
```

### Task 2: Resizable custom DataTable headers

**Files:**
- Modify: `src/components/common/DataTable.vue`
- Modify: `src/components/common/__tests__/DataTableSelection.spec.js`

- [ ] **Step 1: Write a failing mouse-drag regression test**

Extend the existing suite with a stable storage id, mock header geometry, dispatch `mousedown`/`mousemove`/`mouseup`, and assert the reactive `<col>` width and storage value:

```js
it('resizes a column with a minimum width and restores it after remount', async () => {
  localStorage.clear()
  const props = {
    data: [{ id: 1, name: '示例' }],
    columns: [{ key: 'name', label: '名称', prop: 'name', width: '180px' }],
    columnStorageKey: 'comments'
  }
  const wrapper = mount(DataTable, { props })
  wrapper.find('th').element.getBoundingClientRect = () => ({ width: 180 })

  await wrapper.find('.column-resize-handle').trigger('mousedown', { button: 0, clientX: 180 })
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 20 }))
  document.dispatchEvent(new MouseEvent('mouseup', { clientX: 20 }))
  await wrapper.vm.$nextTick()

  expect(wrapper.find('col[data-column-id="name"]').attributes('style')).toContain('72px')
  expect(JSON.parse(localStorage.getItem('blog-admin:table-columns:v1:comments'))).toEqual({ name: 72 })
  wrapper.unmount()

  const restored = mount(DataTable, { props })
  expect(restored.find('col[data-column-id="name"]').attributes('style')).toContain('72px')
  restored.unmount()
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --runInBand src/components/common/__tests__/DataTableSelection.spec.js`

Expected: FAIL because the resize handle and `columnStorageKey` integration do not exist.

- [ ] **Step 3: Add the DataTable resize integration**

Add a `columnStorageKey` string prop, use `useResizableColumns`, render a `<colgroup>` for the selection and data columns, iterate over `resizableColumns` in header/body, and render this handle in every data header:

```vue
<span
  class="column-resize-handle"
  role="separator"
  aria-orientation="vertical"
  :aria-label="`调整${column.label}列宽`"
  @mousedown="startColumnResize($event, column)"
/>
```

Track `startX`, the measured header width, and the active column. On document `mousemove`, call `handleResizeColumn(startWidth + event.clientX - startX, column, false)` for immediate rendering. On `mouseup`, call it with `true`, remove listeners, and clear the active drag. Also remove listeners in `onBeforeUnmount`.

Use scoped CSS that keeps the header positioned and gives the last 10px a visible-on-hover `col-resize` handle:

```scss
th { position: relative; }
.column-resize-handle {
  position: absolute;
  inset-block: 0;
  inset-inline-end: -5px;
  z-index: 2;
  width: 10px;
  cursor: col-resize;
  touch-action: none;
}
.column-resize-handle::after {
  content: '';
  position: absolute;
  inset-block: 20%;
  inset-inline-start: 4px;
  width: 2px;
  background: var(--color-primary);
  opacity: 0;
}
th:hover .column-resize-handle::after,
.column-resize-handle.is-resizing::after { opacity: .7; }
```

- [ ] **Step 4: Run the focused component and composable tests**

Run: `npm test -- --runInBand src/components/common/__tests__/DataTableSelection.spec.js src/composables/__tests__/useResizableColumns.spec.js`

Expected: all tests PASS with no leaked-listener warnings.

- [ ] **Step 5: Commit the custom table behavior**

```bash
git add src/components/common/DataTable.vue src/components/common/__tests__/DataTableSelection.spec.js
git commit -m "feat: resize custom data table columns"
```

### Task 3: Connect every admin list

**Files:**
- Modify: `src/views/dynamics/DynamicList.vue`
- Modify: `src/views/files/FileList.vue`
- Modify: `src/views/categories/CategoryList.vue`
- Modify: `src/views/tags/TagList.vue`
- Modify: `src/views/comments/CommentList.vue`
- Modify: `src/views/accessLogs/AccessLogList.vue`
- Create: `src/views/__tests__/resizableAdminTables.spec.js`

- [ ] **Step 1: Write the six-view integration contract test**

Read each SFC source and assert the four Ant tables contain `:columns="resizableColumns"`, `@resizeColumn="handleResizeColumn"`, and their unique table id; assert both custom tables contain their unique `column-storage-key` values:

```js
import fs from 'node:fs'
import path from 'node:path'

const readView = (relativePath) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')

test.each([
  ['src/views/dynamics/DynamicList.vue', 'dynamics'],
  ['src/views/files/FileList.vue', 'files'],
  ['src/views/categories/CategoryList.vue', 'categories'],
  ['src/views/tags/TagList.vue', 'tags']
])('%s connects Ant table resizing with storage id %s', (file, id) => {
  const source = readView(file)
  expect(source).toContain(':columns="resizableColumns"')
  expect(source).toContain('@resizeColumn="handleResizeColumn"')
  expect(source).toContain(`useResizableColumns('${id}'`)
})

test.each([
  ['src/views/comments/CommentList.vue', 'comments'],
  ['src/views/accessLogs/AccessLogList.vue', 'access-logs']
])('%s configures DataTable storage id %s', (file, id) => {
  expect(readView(file)).toContain(`column-storage-key="${id}"`)
})
```

- [ ] **Step 2: Run the integration contract test and verify RED**

Run: `npm test -- --runInBand src/views/__tests__/resizableAdminTables.spec.js`

Expected: six cases FAIL because no view is connected yet.

- [ ] **Step 3: Connect the four Ant Design Vue tables**

In each file, import `useResizableColumns` from `@/composables/useResizableColumns`, preserve the static column arrays, create the projection after the arrays are defined, and change the table binding/event:

```js
const { columns: resizableColumns, handleResizeColumn } = useResizableColumns('categories', columns)
```

Use ids `categories`, `tags`, and `files` in their respective views. DynamicList uses its existing `responsive` state so desktop and mobile projections share one persisted width map:

```js
const activeColumns = computed(() => responsive.value ? columnsForMobile : columns)
const { columns: resizableColumns, handleResizeColumn } = useResizableColumns('dynamics', activeColumns)
```

All four templates use:

```vue
<a-table
  :columns="resizableColumns"
  @resizeColumn="handleResizeColumn"
  ...
>
```

- [ ] **Step 4: Assign the two custom DataTable identifiers**

Add exactly these props without changing other bindings:

```vue
<DataTable column-storage-key="comments" ... />
<DataTable column-storage-key="access-logs" ... />
```

Give every custom column an explicit stable `key` matching its `prop` or slot name where one is missing, so label changes do not discard saved widths.

- [ ] **Step 5: Run view, component, and composable tests**

Run: `npm test -- --runInBand src/views/__tests__/resizableAdminTables.spec.js src/components/common/__tests__/DataTableSelection.spec.js src/composables/__tests__/useResizableColumns.spec.js`

Expected: all tests PASS.

- [ ] **Step 6: Commit all list integrations**

```bash
git add src/views/dynamics/DynamicList.vue src/views/files/FileList.vue src/views/categories/CategoryList.vue src/views/tags/TagList.vue src/views/comments/CommentList.vue src/views/accessLogs/AccessLogList.vue src/views/__tests__/resizableAdminTables.spec.js
git commit -m "feat: enable column resizing on admin lists"
```

### Task 4: Full verification and browser interaction check

**Files:**
- Modify only if verification exposes a defect in files already listed above.

- [ ] **Step 1: Run repository quality gates**

Run: `npm run check`

Expected: all Jest suites PASS and `vite build` exits 0.

- [ ] **Step 2: Inspect the exact release diff**

Run: `git diff 31650eb..HEAD --check && git status --short --branch`

Expected: no whitespace errors; only the two pre-existing untracked August documents remain outside the commits.

- [ ] **Step 3: Run a production-shaped local preview**

Run: `npm run preview -- --host 127.0.0.1`

Open `/login`, authenticate with the existing local development session if available, and verify one Ant table plus one custom `DataTable`: the separator is visible on hover, drag changes width, shrinking stops at 72px, and reload restores the final width. If authentication data is unavailable, use a focused component harness for the same DOM interaction and verify the built login/public routes load.

- [ ] **Step 4: Resolve any verification defect through a new RED/GREEN cycle**

For each defect, add a focused regression assertion to the nearest existing test, run it to observe the expected failure, implement the smallest correction, then rerun the focused test and `npm run check`.

### Task 5: Push, deploy, and verify production

**Files:**
- No source changes expected.

- [ ] **Step 1: Push the tested main branch**

Run: `git push origin main`

Expected: remote `main` advances to the verified local implementation commit.

- [ ] **Step 2: Inspect production before mutation**

Use the existing SSH configuration to confirm the active `/var/www/myblog-admin/current` target, available disk space, Nginx configuration validity, and current public HTTP status. Stop if the active path or service layout differs from the documented release/current setup.

- [ ] **Step 3: Publish the exact verified dist atomically**

Create `/var/www/myblog-admin/releases/<short-sha>`, transfer only the local verified `dist/` contents into it, confirm `index.html` and hashed assets exist, switch `/var/www/myblog-admin/current` to that release, run `nginx -t`, and reload Nginx. If validation fails, repoint `current` to the recorded previous target.

- [ ] **Step 4: Verify production responses and deployed fingerprint**

Check `https://leexd.top/`, `/login`, `/dashboard`, `/blog`, and `/api/blog/dynamics/` for their expected 200/auth behavior. Fetch the deployed `index.html`, identify its main hashed JS asset, and verify its checksum matches the corresponding locally built asset.

- [ ] **Step 5: Report release and rollback evidence**

Report the pushed commit, release directory, previous symlink target, full Jest/build result, production HTTP checks, and the one-command rollback target. Do not include credentials, tokens, cookies, or unrelated untracked files.
