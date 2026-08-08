const draftKey = (id) => `kylin:editor-draft:${id}`
const writableFields = ['title', 'content', 'type', 'status', 'mediaUrls', 'fileIds', 'categoryId', 'tags']

export function saveEditorDraft(id, value) {
  const draft = Object.fromEntries(
    writableFields
      .filter((field) => value[field] !== undefined)
      .map((field) => [field, value[field]])
  )
  try {
    localStorage.setItem(draftKey(id), JSON.stringify({ ...draft, savedAt: Date.now() }))
  } catch {
    // Draft persistence must never prevent editing or saving the current form.
  }
}

export function loadEditorDraft(id) {
  try {
    return JSON.parse(localStorage.getItem(draftKey(id)))
  } catch {
    return null
  }
}

export function clearEditorDraft(id) {
  try {
    localStorage.removeItem(draftKey(id))
  } catch {
    // Clearing a stale draft is best-effort and should not interrupt navigation.
  }
}
