import { afterEach, describe, expect, it } from '@jest/globals'
import { mount } from '@vue/test-utils'
import ArticleImageLightbox from '../ArticleImageLightbox.vue'

const images = [
  { src: '/media/one.png', alt: '第一张' },
  { src: '/media/two.png', alt: '第二张' }
]

const mountViewer = (props = {}) => mount(ArticleImageLightbox, {
  props: { open: true, images, startIndex: 0, ...props },
  attachTo: document.body
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
})

describe('ArticleImageLightbox', () => {
  it('展示当前序号、说明和图片地址', () => {
    const wrapper = mountViewer()
    expect(document.querySelector('.image-lightbox__counter').textContent.trim()).toBe('1 / 2')
    expect(document.querySelector('.image-lightbox__caption').textContent).toBe('第一张')
    expect(document.querySelector('.image-lightbox__image').getAttribute('src')).toBe('/media/one.png')
    wrapper.unmount()
  })

  it('从 startIndex 打开，上一张/下一张按边界禁用', async () => {
    const wrapper = mountViewer({ startIndex: 1 })
    expect(document.querySelector('.image-lightbox__counter').textContent.trim()).toBe('2 / 2')
    const buttons = [...document.querySelectorAll('.image-lightbox__circle')]
    const prev = buttons.find((button) => button.getAttribute('aria-label') === '上一张')
    const next = buttons.find((button) => button.getAttribute('aria-label') === '下一张')
    expect(next.disabled).toBe(true)
    expect(prev.disabled).toBe(false)
    prev.click()
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.image-lightbox__counter').textContent.trim()).toBe('1 / 2')
    wrapper.unmount()
  })

  it('点击关闭、Esc 与遮罩空白处都会请求关闭', async () => {
    const wrapper = mountViewer()
    document.querySelector('[aria-label="关闭图片预览"]').click()
    expect(wrapper.emitted('close')).toHaveLength(1)

    document.querySelector('.image-lightbox').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(2)
    wrapper.unmount()
  })

  it('打开时锁定页面滚动，关闭后还原', async () => {
    const wrapper = mountViewer()
    expect(document.body.style.position).toBe('fixed')
    await wrapper.setProps({ open: false })
    expect(document.body.style.position).toBe('')
    expect(document.querySelector('.image-lightbox')).toBeNull()
    wrapper.unmount()
  })

  it('放大后可用“适应”复位，且按钮状态跟随缩放', async () => {
    const wrapper = mountViewer()
    const plus = [...document.querySelectorAll('.image-lightbox__circle')].find((button) => button.getAttribute('aria-label') === '放大')
    plus.click()
    await wrapper.vm.$nextTick()
    const image = document.querySelector('.image-lightbox__image')
    expect(image.style.transform).toContain('scale(1.35)')
    document.querySelector('.image-lightbox__pill').click()
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.image-lightbox__image').style.transform).toContain('scale(1)')
    wrapper.unmount()
  })
})
