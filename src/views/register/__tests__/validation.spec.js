import { validatePasswordConfirmation } from '../validation'

describe('register validation', () => {
  it('rejects an empty password confirmation', async () => {
    await expect(validatePasswordConfirmation('secret123', '')).rejects.toThrow('请确认密码')
  })

  it('rejects a mismatched password confirmation', async () => {
    await expect(validatePasswordConfirmation('secret123', 'secret456')).rejects.toThrow('两次输入的密码不一致')
  })

  it('accepts a matching password confirmation', async () => {
    await expect(validatePasswordConfirmation('secret123', 'secret123')).resolves.toBeUndefined()
  })
})
