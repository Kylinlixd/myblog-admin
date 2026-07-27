import '@testing-library/jest-dom'
import { randomUUID } from 'node:crypto'

if (!globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: randomUUID
  })
}

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
