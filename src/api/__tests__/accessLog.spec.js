import request from '@/services/http/client'
import { getAccessLogOverview } from '../accessLog'

describe('access log overview API', () => {
  it('requests the global seven-day overview without list filters', async () => {
    jest.spyOn(request, 'get').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: { active_ips: 265 }
    })

      await expect(getAccessLogOverview()).resolves.toEqual({
        code: 200,
        message: 'success',
        data: { active_ips: 265 }
      })
    expect(request.get).toHaveBeenCalledWith('/api/access-logs/overview/')
  })
})
