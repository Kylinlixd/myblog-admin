import { downloadFile, getFileList, searchFiles, uploadFile } from '../file'
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
    expect(request.get).toHaveBeenCalledWith('/api/upload/files/', {
      params: {
        page: 1,
        page_size: 10,
        q: undefined,
        type: undefined
      }
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

  it('returns canonical upload fields while preserving useful backend fields', async () => {
    jest.spyOn(request, 'post').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: {
        id: 9,
        name: 'audio.mp3',
        file_type: 'audio',
        file_size: 2048,
        file_url: '/media/audio.mp3',
        checksum: 'abc123'
      }
    })

    const file = new File(['audio'], 'audio.mp3', { type: 'audio/mpeg' })

    await expect(uploadFile({ file, file_type: 'audio' })).resolves.toEqual({
      id: 9,
      name: 'audio.mp3',
      file_type: 'audio',
      file_size: 2048,
      file_url: '/media/audio.mp3',
      checksum: 'abc123',
      type: 'audio',
      size: 2048,
      url: '/media/audio.mp3'
    })
  })

  it('forwards upload progress and preserves storage diagnostics', async () => {
    jest.spyOn(request, 'post').mockImplementationOnce((_url, _data, options) => {
      options.onUploadProgress({ loaded: 5, total: 10 })
      return Promise.resolve({
        code: 200,
        data: {
          id: 10,
          file_type: 'document',
          file_size: 10,
          file_url: '/api/upload/public/10/',
          storage_backend: 'xion',
          checksum: 'abc'
        }
      })
    })
    const onProgress = jest.fn()
    const file = new File(['document'], 'guide.pdf', { type: 'application/pdf' })

    const result = await uploadFile({ file, file_type: 'document', onProgress })

    expect(onProgress).toHaveBeenCalledWith(50)
    expect(request.post.mock.calls[0][2].timeout).toBe(1800000)
    expect(result.storage_backend).toBe('xion')
    expect(result.url).toBe('/api/upload/public/10/')
  })

  it('uses the long transfer timeout for downloads', async () => {
    jest.spyOn(request, 'post').mockResolvedValueOnce(new Blob(['file']))

    await downloadFile(9)

    expect(request.post).toHaveBeenCalledWith(
      '/api/upload/files/9/download/',
      null,
      { responseType: 'blob', timeout: 1800000 }
    )
  })
})
