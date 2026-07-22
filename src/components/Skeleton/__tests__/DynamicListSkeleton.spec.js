import { mount } from '@vue/test-utils'
import { Skeleton } from 'ant-design-vue'

import DynamicListSkeleton from '../DynamicListSkeleton.vue'

describe('DynamicListSkeleton', () => {
  it('uses the registered Ant Design button skeleton', () => {
    const wrapper = mount(DynamicListSkeleton, {
      global: { plugins: [Skeleton] }
    })

    expect(wrapper.find('.ant-skeleton-button').exists()).toBe(true)
  })
})
