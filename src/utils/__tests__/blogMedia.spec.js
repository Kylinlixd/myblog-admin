import { describe, expect, it } from '@jest/globals'
import {
  attachmentKind,
  attachmentLabel,
  attachmentMediaItems,
  guessMediaType,
  imageMediaItems,
  isInlineMedia,
  normalizeMediaItems,
  previewMediaItem
} from '../blogMedia'

describe('blogMedia', () => {
  it('图片、音频、视频算媒体，其余类型算附件', () => {
    expect(isInlineMedia({ type: 'image' })).toBe(true)
    expect(isInlineMedia({ type: 'audio' })).toBe(true)
    expect(isInlineMedia({ type: 'video' })).toBe(true)
    expect(isInlineMedia({ type: 'pdf' })).toBe(false)
    expect(isInlineMedia({ type: 'file' })).toBe(false)
  })

  it('缺少类型或声明为 other 时按扩展名兜底', () => {
    expect(guessMediaType('/media/a.PNG')).toBe('image')
    expect(guessMediaType('/media/demo.mp4?x=1')).toBe('video')
    expect(guessMediaType('/media/read.mp3')).toBe('audio')
    expect(guessMediaType('/media/report.pdf')).toBe('')

    const [item] = normalizeMediaItems({ mediaUrls: [{ url: '/media/demo.webp' }] })
    expect(item.type).toBe('image')
  })

  it('不会把全局类型 file 套到明确是图片的媒体上', () => {
    const [item] = normalizeMediaItems({
      type: 'file',
      mediaUrls: [{ url: 'https://cdn.example.com/a.jpg', type: 'image' }]
    })
    expect(item.type).toBe('image')
  })

  it('保留名称、大小、海报，并去掉重复地址', () => {
    const items = normalizeMediaItems({
      mediaUrls: [
        { url: '/media/a.pdf', name: '简历.pdf', size: 2048, type: 'file' },
        { url: '/media/a.pdf', name: '重复', type: 'file' },
        { url: '/media/cover.png', type: 'image', poster_url: '/media/poster.png' }
      ]
    })
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ name: '简历.pdf', size: 2048 })
    expect(items[1].posterUrl).toContain('/media/poster.png')
  })

  it('列表封面优先图片，其次视频，音频和文件不露出', () => {
    expect(previewMediaItem({ mediaUrls: [{ url: '/media/a.mp4', type: 'video' }, { url: '/media/a.jpg', type: 'image' }] }).url).toContain('a.jpg')
    expect(previewMediaItem({ mediaUrls: [{ url: '/media/a.mp4', type: 'video' }, { url: '/media/a.mp3', type: 'audio' }] }).url).toContain('a.mp4')
    expect(previewMediaItem({ mediaUrls: [{ url: '/media/a.pdf', type: 'file' }] })).toBeNull()
  })

  it('图片列表与附件列表互不重叠', () => {
    const dynamic = {
      mediaUrls: [
        { url: '/media/1.jpg', type: 'image' },
        { url: '/media/2.mp3', type: 'audio' },
        { url: '/media/3.zip', type: 'file' }
      ]
    }
    expect(imageMediaItems(dynamic).map((item) => item.url)).toEqual([expect.stringContaining('1.jpg')])
    expect(attachmentMediaItems(dynamic).map((item) => item.url)).toEqual([expect.stringContaining('3.zip')])
  })

  it('按扩展名给出附件类型与回退名称', () => {
    expect(attachmentKind('/files/合同.pdf')).toBe('pdf')
    expect(attachmentKind('/files/表格.xlsx')).toBe('excel')
    expect(attachmentKind('/files/素材.zip')).toBe('archive')
    expect(attachmentKind('/files/未知.bin')).toBe('file')
    expect(attachmentLabel({ url: 'https://cdn.example.com/files/简历最终版.pdf?x=1' })).toBe('简历最终版.pdf')
  })
})
