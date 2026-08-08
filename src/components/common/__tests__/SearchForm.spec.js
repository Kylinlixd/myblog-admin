import { mount } from '@vue/test-utils'

import SearchForm from '../SearchForm.vue'

describe('SearchForm reset', () => {
  it('preserves numeric and boolean default values', async () => {
    const form = { page: 4, pageSize: 50, minViews: 15, includeArchived: true, keyword: 'draft' }
    const wrapper = mount(SearchForm, {
      props: {
        form,
        defaultValues: { page: 1, pageSize: 20, minViews: 0, includeArchived: false, keyword: '' }
      },
      global: {
        stubs: {
          'a-form': { template: '<form><slot /></form>' },
          'a-button': {
            emits: ['click'],
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    await wrapper.find('.reset-button').trigger('click')

    expect(form).toEqual({ page: 1, pageSize: 20, minViews: 0, includeArchived: false, keyword: '' })
  })
})
