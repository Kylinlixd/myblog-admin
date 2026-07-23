export function validatePasswordConfirmation(password, confirmPassword) {
  if (!confirmPassword) {
    return Promise.reject(new Error('请确认密码'))
  }

  if (confirmPassword !== password) {
    return Promise.reject(new Error('两次输入的密码不一致'))
  }

  return Promise.resolve()
}
