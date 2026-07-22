import '@testing-library/jest-dom'

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
