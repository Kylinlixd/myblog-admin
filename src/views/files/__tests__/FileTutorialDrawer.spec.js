import { mount } from '@vue/test-utils'

import FileTutorialDrawer from '../FileTutorialDrawer.vue'

const DrawerStub = {
  props: { open: Boolean },
  emits: ['close'],
  template: '<aside v-if="open" data-testid="tutorial-drawer"><slot /></aside>'
}

describe('FileTutorialDrawer', () => {
  it('documents the complete operator workflow', () => {
    const wrapper = mount(FileTutorialDrawer, {
      props: { open: true },
      global: {
        stubs: {
          'a-drawer': DrawerStub,
          'a-alert': { template: '<div><slot /></div>' }
        }
      }
    })

    for (const text of ['上传文件', '复制链接', '插入文章', '下载与删除', '常见问题']) {
      expect(wrapper.text()).toContain(text)
    }
    expect(wrapper.text()).toContain('1 GB')
  })

  it('emits the model update when the drawer closes', async () => {
    const wrapper = mount(FileTutorialDrawer, {
      props: { open: true },
      global: { stubs: { 'a-drawer': DrawerStub, 'a-alert': true } }
    })

    wrapper.findComponent(DrawerStub).vm.$emit('close')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })
})
