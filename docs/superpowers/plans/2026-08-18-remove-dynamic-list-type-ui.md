# Remove Dynamic List Type UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the automatic dynamic type filter and table column from the admin content list without changing the API or persisted data.

**Architecture:** The change is isolated to `DynamicList.vue`: remove the type form binding and type column, then stop serializing that filter into list requests. The existing mounted component test will assert the UI and request contract, so no backend change is needed.

**Tech Stack:** Vue 3 Composition API, Ant Design Vue, Jest, Vue Test Utils.

---

### Task 1: Lock the removed type UI and request contract with a failing test

**Files:**
- Modify: `src/views/dynamics/__tests__/DynamicListMountedInteractions.spec.js`

- [ ] **Step 1: Add a test after the serial-number test**

```js
it('omits automatic type UI and never sends a type filter', async () => {
  const wrapper = mount(DynamicList, { global: { stubs: globalStubs } })
  await flushPromises()
  getDynamicList.mockClear()

  expect(wrapper.text()).not.toContain('类型')
  expect(wrapper.vm.columns.some((column) => column.dataIndex === 'type')).toBe(false)

  await wrapper.vm.handleSearch()
  expect(getDynamicList).toHaveBeenLastCalledWith(expect.not.objectContaining({ type: expect.anything() }))

  wrapper.unmount()
})
```

- [ ] **Step 2: Run the test to verify it fails for the existing type control**

Run: `npm test -- --runInBand --forceExit DynamicListMountedInteractions`

Expected: FAIL because the current rendered filter text and desktop `columns` still contain `type`.

### Task 2: Remove the automatic type UI and filter parameter

**Files:**
- Modify: `src/views/dynamics/DynamicList.vue:63-76`
- Modify: `src/views/dynamics/DynamicList.vue:250-279`
- Modify: `src/views/dynamics/DynamicList.vue:322-333`
- Modify: `src/views/dynamics/DynamicList.vue:367-411`

- [ ] **Step 1: Remove the type selector from the search form**

Delete the complete `<a-form-item label="类型">` block, including the `a-select` and its four options.

- [ ] **Step 2: Remove type from the reactive search form and API parameters**

```js
const searchForm = reactive({
  content: '',
  title: '',
  categoryId: undefined,
  tagIds: [],
  status: undefined
})

const params = {
  page: requestedPage,
  pageSize: pageSize.value,
  status: searchForm.status,
  content: searchForm.content?.trim(),
  title: searchForm.title?.trim(),
  categoryId: searchForm.categoryId,
  tagIds: searchForm.tagIds
}
```

Delete `searchForm.type = undefined` from `resetSearch()`.

- [ ] **Step 3: Remove the desktop type column**

Delete the object beginning with `title: '类型'` from `columns`. Do not alter `columnsForMobile`, which already excludes that column.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- --runInBand --forceExit DynamicListMountedInteractions`

Expected: PASS.

- [ ] **Step 5: Run the full frontend suite and production build**

Run: `npm test -- --runInBand --forceExit && npm run build`

Expected: Jest exits successfully and Vite prints `✓ built`.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/views/dynamics/DynamicList.vue src/views/dynamics/__tests__/DynamicListMountedInteractions.spec.js
git commit -m "fix: remove dynamic list type controls"
```
