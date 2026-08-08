import { getFileList } from '../file'
import request from '@/utils/request'

describe('file API normalization', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('maps backend file fields from collection results for views', async () => {
    jest.spyOn(request, 'get').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: {
        count: 1,
        results: [{
          id: 7,
          file_type: 'image',
          file_size: 0,
          file_url: '/media/image.png'
        }]
      }
    })

    const response = await getFileList()

    expect(response.data).toEqual({
      items: [{
        id: 7,
        file_type: 'image',
        file_size: 0,
        file_url: '/media/image.png',
        type: 'image',
        size: 0,
        url: '/media/image.png'
      }],
      total: 1
    })
  })
})
