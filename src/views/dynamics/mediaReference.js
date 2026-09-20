/**
 * 媒体引用正文片段。
 *
 * 「仅关联媒体」与「插入正文」的差别落在这一层：
 * - 仅关联媒体：只把文件写进 form.mediaUrls / form.fileIds，正文保持不变；
 * - 插入正文：在附件关联之外，再把下面的引用片段插入正文光标处。
 */

const REFERENCE_BUILDERS = {
  image: (file) => `![${file.name}](${file.url})`,
  audio: (file) => `<audio controls src="${file.url}"></audio>`,
  video: (file) => `<video controls src="${file.url}"></video>`
}

export function buildMediaReference(file) {
  if (!file || !file.url) return ''
  const build = REFERENCE_BUILDERS[file.type] || ((item) => `[${item.name || '文件'}](${item.url})`)
  return build(file)
}

export function buildMediaReferences(files = []) {
  return (files || []).map(buildMediaReference).filter(Boolean)
}

export function isMediaReferenced(content, file) {
  if (!file || !file.url) return true
  return String(content || '').includes(file.url)
}

/** 正文里已经有该地址的文件不再重复插入，只保留还没引用的。 */
export function filterUnreferencedFiles(content, files = []) {
  return (files || []).filter((file) => !isMediaReferenced(content, file))
}
