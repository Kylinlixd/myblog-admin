import { createPinia } from 'pinia'
import { useAppStore } from './app'
import { useUserStore } from './user'

const pinia = createPinia()

export {
  pinia,
  useAppStore,
  useUserStore
} 