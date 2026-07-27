const draftKey = (id) => `kylin:editor-draft:${id}`
const writableFields = ['title', 'content', 'type', 'status', 'mediaUrls', 'fileIds', 'categoryId', 'tags']

export function saveEditorDraft(id, value) {
  const draft = Object.fromEntries(
    writableFields
      .filter((field) => value[field] !== undefined)
      .map((field) => [field, value[field]])
  )
  localStorage.setItem(draftKey(id), JSON.stringify({ ...draft, savedAt: Date.now() }))
}

export function loadEditorDraft(id) {
  try {
    return JSON.parse(localStorage.getItem(draftKey(id)))
  } catch {
    return null
  }
}

export function clearEditorDraft(id) {
  localStorage.removeItem(draftKey(id))
}
