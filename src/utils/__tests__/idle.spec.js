import { scheduleIdle } from '../idle'

describe('scheduleIdle', () => {
  afterEach(() => {
    delete window.requestIdleCallback
    delete window.cancelIdleCallback
    jest.useRealTimers()
  })

  it('uses requestIdleCallback when the browser supports it', () => {
    const callback = jest.fn()
    const cancel = jest.fn()
    window.requestIdleCallback = jest.fn(() => 7)
    window.cancelIdleCallback = cancel

    const dispose = scheduleIdle(callback)
    dispose()

    expect(window.requestIdleCallback).toHaveBeenCalledWith(callback)
    expect(cancel).toHaveBeenCalledWith(7)
  })

  it('falls back to a delayed callback', () => {
    jest.useFakeTimers()
    const callback = jest.fn()

    scheduleIdle(callback)
    jest.advanceTimersByTime(249)
    expect(callback).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
