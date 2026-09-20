import {
  buildMediaReference,
  buildMediaReferences,
  filterUnreferencedFiles,
  isMediaReferenced
} from '../mediaReference'

const image = { id: 1, name: 'cover.png', type: 'image', url: '/media/cover.png' }
const video = { id: 2, name: 'demo.mp4', type: 'video', url: '/media/demo.mp4' }
const audio = { id: 3, name: 'bgm.mp3', type: 'audio', url: '/media/bgm.mp3' }
const doc = { id: 4, name: 'note.pdf', type: 'document', url: '/media/note.pdf' }

describe('media reference helpers', () => {
  it('builds the same references the editor used to build inline', () => {
    expect(buildMediaReference(image)).toBe('![cover.png](/media/cover.png)')
    expect(buildMediaReference(audio)).toBe('<audio controls src="/media/bgm.mp3"></audio>')
    expect(buildMediaReference(video)).toBe('<video controls src="/media/demo.mp4"></video>')
    expect(buildMediaReference(doc)).toBe('[note.pdf](/media/note.pdf)')
    expect(buildMediaReferences([image, audio])).toEqual([
      '![cover.png](/media/cover.png)',
      '<audio controls src="/media/bgm.mp3"></audio>'
    ])
  })

  it('ignores entries without a usable url', () => {
    expect(buildMediaReference({ name: 'broken' })).toBe('')
    expect(buildMediaReference(null)).toBe('')
    expect(buildMediaReferences(undefined)).toEqual([])
  })

  it('treats files already present in the body as referenced', () => {
    const content = '正文 ![cover.png](/media/cover.png)'
    expect(isMediaReferenced(content, image)).toBe(true)
    expect(isMediaReferenced(content, video)).toBe(false)
    expect(filterUnreferencedFiles(content, [image, video])).toEqual([video])
    expect(filterUnreferencedFiles('', [image, video])).toEqual([image, video])
  })
})
