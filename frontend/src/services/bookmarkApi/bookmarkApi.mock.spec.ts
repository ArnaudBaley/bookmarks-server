import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockBookmarkApi } from './bookmarkApi.mock'
import { createBookmarkDto } from '@/test-utils'

describe('MockBookmarkApi', () => {
  let api: MockBookmarkApi

  beforeEach(() => {
    api = new MockBookmarkApi()
    api.clearStorage()
    vi.clearAllMocks()
  })

  describe('getAllBookmarks', () => {
    it('returns empty array when no bookmarks exist', async () => {
      const result = await api.getAllBookmarks()
      expect(result).toEqual([])
    })

    it('returns stored bookmarks', async () => {
      await api.createBookmark(createBookmarkDto({ name: 'Bookmark 1' }))
      await api.createBookmark(createBookmarkDto({ name: 'Bookmark 2' }))

      const result = await api.getAllBookmarks()

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(expect.objectContaining({ name: 'Bookmark 1' }))
      expect(result).toContainEqual(expect.objectContaining({ name: 'Bookmark 2' }))
    })

    it('simulates network delay', async () => {
      const startTime = Date.now()
      await api.getAllBookmarks()
      const endTime = Date.now()

      // Should have at least 300ms delay (default)
      expect(endTime - startTime).toBeGreaterThanOrEqual(250) // Allow some margin
    })

    it('persists data in localStorage', async () => {
      await api.createBookmark(createBookmarkDto({ name: 'Persisted Bookmark' }))

      // Create new instance to verify persistence
      const newApi = new MockBookmarkApi()
      const result = await newApi.getAllBookmarks()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Persisted Bookmark')
    })
  })

  describe('createBookmark', () => {
    it('creates bookmark with generated ID', async () => {
      const bookmarkDto = createBookmarkDto({ name: 'New Bookmark', url: 'https://example.com' })
      const result = await api.createBookmark(bookmarkDto)

      expect(result).toHaveProperty('id')
      expect(result.id).toBeTruthy()
      expect(result.name).toBe('New Bookmark')
      expect(result.url).toBe('https://example.com')
    })

    it('adds createdAt and updatedAt timestamps', async () => {
      const bookmarkDto = createBookmarkDto()
      const result = await api.createBookmark(bookmarkDto)

      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
      expect(result.createdAt).toBeTruthy()
      expect(result.updatedAt).toBeTruthy()
      expect(new Date(result.createdAt!).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('stores bookmark in localStorage', async () => {
      const bookmarkDto = createBookmarkDto({ name: 'Stored Bookmark' })
      const created = await api.createBookmark(bookmarkDto)

      const allBookmarks = await api.getAllBookmarks()
      expect(allBookmarks).toContainEqual(created)
    })

    it('generates unique IDs for multiple bookmarks', async () => {
      const bookmark1 = await api.createBookmark(createBookmarkDto({ name: 'Bookmark 1' }))
      const bookmark2 = await api.createBookmark(createBookmarkDto({ name: 'Bookmark 2' }))

      expect(bookmark1.id).not.toBe(bookmark2.id)
    })

    it('simulates network delay', async () => {
      const startTime = Date.now()
      await api.createBookmark(createBookmarkDto())
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(250)
    })
  })

  describe('deleteBookmark', () => {
    it('removes bookmark by ID', async () => {
      const bookmark1 = await api.createBookmark(createBookmarkDto({ name: 'Bookmark 1' }))
      const bookmark2 = await api.createBookmark(createBookmarkDto({ name: 'Bookmark 2' }))

      await api.deleteBookmark(bookmark1.id)

      const allBookmarks = await api.getAllBookmarks()
      expect(allBookmarks).toHaveLength(1)
      expect(allBookmarks[0].id).toBe(bookmark2.id)
    })

    it('does nothing if bookmark ID does not exist', async () => {
      const bookmark = await api.createBookmark(createBookmarkDto())

      await api.deleteBookmark('non-existent-id')

      const allBookmarks = await api.getAllBookmarks()
      expect(allBookmarks).toHaveLength(1)
      expect(allBookmarks[0].id).toBe(bookmark.id)
    })

    it('persists deletion in localStorage', async () => {
      const bookmark = await api.createBookmark(createBookmarkDto({ name: 'To Delete' }))
      await api.deleteBookmark(bookmark.id)

      // Create new instance to verify persistence
      const newApi = new MockBookmarkApi()
      const result = await newApi.getAllBookmarks()

      expect(result).toHaveLength(0)
    })

    it('simulates network delay', async () => {
      const bookmark = await api.createBookmark(createBookmarkDto())
      const startTime = Date.now()
      await api.deleteBookmark(bookmark.id)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(250)
    })
  })

  describe('clearStorage', () => {
    it('clears all stored bookmarks', async () => {
      await api.createBookmark(createBookmarkDto({ name: 'Bookmark 1' }))
      await api.createBookmark(createBookmarkDto({ name: 'Bookmark 2' }))

      api.clearStorage()

      const result = await api.getAllBookmarks()
      expect(result).toHaveLength(0)
    })

    it('removes data from localStorage', async () => {
      await api.createBookmark(createBookmarkDto())
      api.clearStorage()

      const stored = localStorage.getItem('bookmarks-mock-data')
      expect(stored).toBeNull()
    })

    it('handles clearStorage when window is undefined', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR scenario
      global.window = undefined

      // Should not throw
      expect(() => {
        api.clearStorage()
      }).not.toThrow()

      global.window = originalWindow
    })
  })

  describe('localStorage persistence', () => {
    it('persists across API instances', async () => {
      const api1 = new MockBookmarkApi()
      await api1.createBookmark(createBookmarkDto({ name: 'Persisted' }))

      const api2 = new MockBookmarkApi()
      const result = await api2.getAllBookmarks()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Persisted')
    })

    it('handles corrupted localStorage data gracefully', async () => {
      localStorage.setItem('bookmarks-mock-data', 'invalid json')

      // Should not throw, but return empty array
      const api = new MockBookmarkApi()
      // Accessing getStorage internally would fail, but getAllBookmarks should handle it
      // Since getStorage is private, we test through getAllBookmarks
      await expect(api.getAllBookmarks()).resolves.toEqual([])
    })

    it('handles SSR (window undefined)', async () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR scenario
      global.window = undefined

      const api = new MockBookmarkApi()
      // Should not throw
      await expect(api.getAllBookmarks()).resolves.toEqual([])

      global.window = originalWindow
    })
  })

  describe('Edge cases', () => {
    it('handles multiple rapid operations', async () => {
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(api.createBookmark(createBookmarkDto({ name: `Bookmark ${i}` })))
      }

      const bookmarks = await Promise.all(promises)
      expect(bookmarks).toHaveLength(5)

      const allBookmarks = await api.getAllBookmarks()
      expect(allBookmarks).toHaveLength(5)
    })

    it('maintains data integrity during concurrent operations', async () => {
      const bookmark1 = await api.createBookmark(createBookmarkDto({ name: 'Bookmark 1' }))
      await api.createBookmark(createBookmarkDto({ name: 'Bookmark 2' }))

      // Concurrent delete and create
      await Promise.all([
        api.deleteBookmark(bookmark1.id),
        api.createBookmark(createBookmarkDto({ name: 'Bookmark 3' })),
      ])

      const allBookmarks = await api.getAllBookmarks()
      expect(allBookmarks).toHaveLength(2)
      expect(allBookmarks.some((b) => b.name === 'Bookmark 2')).toBe(true)
      expect(allBookmarks.some((b) => b.name === 'Bookmark 3')).toBe(true)
    })
  })
})

