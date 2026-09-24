import fs from 'node:fs'
import path from 'node:path'

const readDetail = () =>
  fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')

describe('blog dynamic detail media presentation', () => {
  it('lays attached images out in a responsive gallery', () => {
    const source = readDetail()

    expect(source).toMatch(
      /\.dynamic-media\s*\{[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\)/
    )
  })

  it('keeps attached images in their own aspect ratio instead of a fixed 16:9 frame', () => {
    const source = readDetail()
    const imageRule = source.slice(
      source.indexOf('.dynamic-media__image {'),
      source.indexOf('.dynamic-media__video {')
    )

    expect(imageRule).not.toContain('aspect-ratio')
    expect(imageRule).not.toContain('#10243a')
    expect(imageRule).toContain('width: auto')
    expect(imageRule).toContain('margin-inline: auto')
    expect(imageRule).toMatch(/max-height: min\(62vh, 560px\)/)
  })

  it('still gives videos a 16:9 player and caps tall inline screenshots', () => {
    const source = readDetail()
    const videoRule = source.slice(
      source.indexOf('.dynamic-media__video {'),
      source.indexOf('.dynamic-media__audio')
    )

    expect(videoRule).toContain('aspect-ratio: 16 / 9')
    expect(source).toMatch(/:deep\(\.markdown-body img\)\s*\{[\s\S]*?max-height: min\(78vh, 820px\)/)
    expect(source).toMatch(/:deep\(\.markdown-body img\)\s*\{[\s\S]*?margin: 1\.5rem auto/)
  })
})
