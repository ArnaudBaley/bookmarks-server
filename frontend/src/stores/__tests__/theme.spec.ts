import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTestPinia } from '@/test-utils'
import { useThemeStore } from '../theme'
import { mockMatchMedia } from '@/test-utils'

describe('Theme Store', () => {
  beforeEach(() => {
    localStorage.clear()
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark')
    }
    createTestPinia()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial theme detection', () => {
    it('uses theme from localStorage if available', () => {
      localStorage.setItem('bookmarks-theme', 'dark')
      const store = useThemeStore()
      expect(store.theme).toBe('dark')
    })

    it('uses light theme from localStorage', () => {
      localStorage.setItem('bookmarks-theme', 'light')
      const store = useThemeStore()
      expect(store.theme).toBe('light')
    })

    it('falls back to system preference when localStorage is empty', () => {
      mockMatchMedia(true) // Dark mode preferred
      const store = useThemeStore()
      expect(store.theme).toBe('dark')
    })

    it('falls back to light theme when system preference is light', () => {
      mockMatchMedia(false) // Light mode preferred
      const store = useThemeStore()
      expect(store.theme).toBe('light')
    })

    it('defaults to light theme when no preference is set', () => {
      // No localStorage, no matchMedia
      const store = useThemeStore()
      expect(store.theme).toBe('light')
    })

    it('ignores invalid localStorage values', () => {
      localStorage.setItem('bookmarks-theme', 'invalid')
      const store = useThemeStore()
      // Should fall back to system preference or default
      expect(store.theme).toBe('light')
    })
  })

  describe('setTheme', () => {
    it('updates theme value', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
    })

    it('saves theme to localStorage', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      expect(localStorage.getItem('bookmarks-theme')).toBe('dark')
    })

    it('applies theme to document', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      expect(typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false).toBe(true)
    })

    it('removes dark class when setting light theme', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      const hasDarkAfterDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
      expect(hasDarkAfterDark).toBe(true)

      store.setTheme('light')
      const hasDarkAfterLight = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
      expect(hasDarkAfterLight).toBe(false)
    })

    it('handles SSR (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR scenario
      global.window = undefined

      const store = useThemeStore()
      store.setTheme('dark')
      expect(store.theme).toBe('dark')

      global.window = originalWindow
    })
  })

  describe('toggleTheme', () => {
    it('switches from light to dark', () => {
      const store = useThemeStore()
      store.setTheme('light')
      store.toggleTheme()
      expect(store.theme).toBe('dark')
    })

    it('switches from dark to light', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })

    it('updates localStorage when toggling', () => {
      const store = useThemeStore()
      store.setTheme('light')
      store.toggleTheme()
      expect(localStorage.getItem('bookmarks-theme')).toBe('dark')
    })

    it('applies theme to document when toggling', () => {
      const store = useThemeStore()
      store.setTheme('light')
      const hasDarkBeforeToggle = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
      expect(hasDarkBeforeToggle).toBe(false)

      store.toggleTheme()
      const hasDarkAfterToggle = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
      expect(hasDarkAfterToggle).toBe(true)
    })
  })

  describe('applyTheme (tested indirectly through setTheme)', () => {
    it('adds dark class for dark theme', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      const hasDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
      expect(hasDark).toBe(true)
    })

    it('removes dark class for light theme', () => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark')
      }
      const store = useThemeStore()
      store.setTheme('light')
      const hasDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
      expect(hasDark).toBe(false)
    })
  })

  describe('Theme watcher', () => {
    it('applies theme on initialization', () => {
      const store = useThemeStore()
      store.setTheme('dark')
      // Theme should be applied immediately
      const hasDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
      expect(hasDark).toBe(true)
    })

    it('applies theme when theme value changes', async () => {
      const store = useThemeStore()
      store.setTheme('light')
      const hasDarkBefore = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
      expect(hasDarkBefore).toBe(false)

      store.setTheme('dark')
      // Wait for watcher to run
      await new Promise((resolve) => setTimeout(resolve, 0))
      const hasDarkAfter = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
      expect(hasDarkAfter).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('handles multiple theme changes', () => {
      const store = useThemeStore()
      store.setTheme('light')
      store.setTheme('dark')
      store.setTheme('light')
      store.setTheme('dark')

      expect(store.theme).toBe('dark')
      expect(localStorage.getItem('bookmarks-theme')).toBe('dark')
    })

    it('persists theme across store instances', () => {
      const store1 = useThemeStore()
      store1.setTheme('dark')

      // Create new store instance (simulating page reload)
      createTestPinia()
      const store2 = useThemeStore()
      // Should read from localStorage
      expect(store2.theme).toBe('dark')
    })
  })
})

