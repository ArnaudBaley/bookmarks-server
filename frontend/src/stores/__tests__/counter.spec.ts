import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '@/test-utils'
import { useCounterStore } from '../counter'

describe('Counter Store', () => {
  let store: ReturnType<typeof useCounterStore>

  beforeEach(() => {
    createTestPinia()
    store = useCounterStore()
  })

  describe('Initial state', () => {
    it('has count set to 0', () => {
      expect(store.count).toBe(0)
    })
  })

  describe('increment', () => {
    it('increases count by 1', () => {
      expect(store.count).toBe(0)
      store.increment()
      expect(store.count).toBe(1)
    })

    it('can be called multiple times', () => {
      store.increment()
      store.increment()
      store.increment()
      expect(store.count).toBe(3)
    })
  })

  describe('doubleCount computed', () => {
    it('returns 0 when count is 0', () => {
      expect(store.doubleCount).toBe(0)
    })

    it('returns double the count value', () => {
      store.increment()
      expect(store.doubleCount).toBe(2)

      store.increment()
      expect(store.doubleCount).toBe(4)

      store.increment()
      expect(store.doubleCount).toBe(6)
    })

    it('updates reactively when count changes', () => {
      expect(store.doubleCount).toBe(0)
      store.increment()
      expect(store.doubleCount).toBe(2)
      store.increment()
      expect(store.doubleCount).toBe(4)
    })
  })
})

