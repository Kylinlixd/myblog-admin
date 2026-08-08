import { getFileList, searchFiles, uploadFile } from '../file'
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

    expect(response).toEqual({
      count: 1,
      results: [{
        id: 7,
        file_type: 'image',
        file_size: 0,
        file_url: '/media/image.png',
        type: 'image',
        size: 0,
        url: '/media/image.png'
      }]
    })
  })

  it('normalizes search results without returning the legacy envelope', async () => {
    jest.spyOn(request, 'get').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: {
        total: 2,
        list: [{
          id: 8,
          type: 'video',
          size: 12,
          url: '/media/video.mp4'
        }]
      }
    })

    await expect(searchFiles({ q: 'video' })).resolves.toEqual({
      count: 2,
      results: [{
        id: 8,
        type: 'video',
        size: 12,
        url: '/media/video.mp4'
      }]
    })
  })

  it('returns upload data without the legacy response envelope', async () => {
    jest.spyOn(request, 'post').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: {
        id: 9,
        name: 'audio.mp3',
        file_type: 'audio',
        file_url: '/media/audio.mp3'
      }
    })

    const file = new File(['audio'], 'audio.mp3', { type: 'audio/mpeg' })

    await expect(uploadFile({ file, file_type: 'audio' })).resolves.toEqual({
      id: 9,
      name: 'audio.mp3',
      file_type: 'audio',
      file_url: '/media/audio.mp3'
    })
  })
})
