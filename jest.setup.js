import '@testing-library/jest-dom'

// Mock Element Plus
jest.mock('element-plus', () => ({
  ElMessage: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  },
  ElMessageBox: {
    confirm: jest.fn().mockResolvedValue(),
    alert: jest.fn().mockResolvedValue(),
    prompt: jest.fn().mockResolvedValue()
  }
}))

// Mock Vue Router
jest.mock('vue-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    back: jest.fn()
  }),
  useRoute: () => ({
    path: '/',
    name: '',
    meta: {}
  })
})) 