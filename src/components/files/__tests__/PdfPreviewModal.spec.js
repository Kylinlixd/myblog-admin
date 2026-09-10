import { flushPromises, mount } from '@vue/test-utils'

import PdfPreviewModal from '../PdfPreviewModal.vue'
import { previewPdf } from '@/api/file'

jest.mock('@/api/file', () => ({
  previewPdf: jest.fn()
}))

const ModalStub = {
  props: { open: Boolean },
  emits: ['cancel'],
  template: '<div v-if="open" data-testid="pdf-modal"><slot /></div>'
}

describe('PdfPreviewModal', () => {
  beforeEach(() => jest.clearAllMocks())

  it('requests the selected PDF with download progress when opened', async () => {
    previewPdf.mockReturnValueOnce(new Promise(() => {}))
    const wrapper = mount(PdfPreviewModal, {
      props: {
        open: false,
        file: { id: 17, name: 'guide.pdf' }
      },
      global: {
        stubs: {
          'a-modal': ModalStub,
          'a-button': { template: '<button><slot /></button>' },
          'a-space': { template: '<div><slot /></div>' },
          'a-progress': true
        }
      }
    })

    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(previewPdf).toHaveBeenCalledWith(17, expect.objectContaining({
      signal: expect.any(AbortSignal),
      onDownloadProgress: expect.any(Function)
    }))
    wrapper.unmount()
  })
})
