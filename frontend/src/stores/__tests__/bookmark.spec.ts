import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia } from '@/test-utils'
import { useBookmarkStore } from '../bookmark'
import { createBookmark, createBookmarkArray, createBookmarkDto } from '@/test-utils'
import * as bookmarkApiModule from '@/services/bookmarkApi'
import type { Bookmark } from '@/types/bookmark'

describe('Bookmark Store', () => {
  let store: ReturnType<typeof useBookmarkStore>

  beforeEach(() => {
    createTestPinia()
    store = useBookmarkStore()
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('has empty bookmarks array', () => {
      expect(store.bookmarks).toEqual([])
    })

    it('has loading set to false', () => {
      expect(store.loading).toBe(false)
    })

    it('has error set to null', () => {
      expect(store.error).toBe(null)
    })
  })

  describe('bookmarksCount computed', () => {
    it('returns 0 when no bookmarks', () => {
      expect(store.bookmarksCount).toBe(0)
    })

    it('returns correct count when bookmarks exist', () => {
      store.bookmarks = createBookmarkArray(3)
      expect(store.bookmarksCount).toBe(3)
    })

    it('updates when bookmarks are added', () => {
      expect(store.bookmarksCount).toBe(0)
      store.bookmarks.push(createBookmark())
      expect(store.bookmarksCount).toBe(1)
    })
  })

  describe('fetchBookmarks', () => {
    it('fetches bookmarks successfully', async () => {
      const mockBookmarks = createBookmarkArray(2)
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'getAllBookmarks').mockResolvedValue(mockBookmarks)

      await store.fetchBookmarks()

      expect(store.bookmarks).toEqual(mockBookmarks)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets loading to true during fetch', async () => {
      let resolvePromise: (value: Bookmark[]) => void
      const promise = new Promise<Bookmark[]>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'getAllBookmarks').mockReturnValue(promise)

      const fetchPromise = store.fetchBookmarks()
      expect(store.loading).toBe(true)

      resolvePromise!(createBookmarkArray(1))
      await fetchPromise

      expect(store.loading).toBe(false)
    })

    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch bookmarks'
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'getAllBookmarks').mockRejectedValue(
        new Error(errorMessage)
      )

      await store.fetchBookmarks()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.bookmarks).toEqual([])
    })

    it('handles non-Error exceptions', async () => {
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'getAllBookmarks').mockRejectedValue('String error')

      await store.fetchBookmarks()

      expect(store.error).toBe('Failed to fetch bookmarks')
      expect(store.loading).toBe(false)
    })

    it('clears error before fetching', async () => {
      store.error = 'Previous error'
      const mockBookmarks = createBookmarkArray(1)
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'getAllBookmarks').mockResolvedValue(mockBookmarks)

      await store.fetchBookmarks()

      expect(store.error).toBe(null)
    })
  })

  describe('addBookmark', () => {
    it('adds bookmark successfully', async () => {
      const newBookmark = createBookmark({ id: 'new-id', name: 'New Bookmark' })
      const bookmarkDto = createBookmarkDto({ name: 'New Bookmark', url: 'https://example.com' })

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'createBookmark').mockResolvedValue(newBookmark)

      const result = await store.addBookmark(bookmarkDto)

      expect(result).toEqual(newBookmark)
      expect(store.bookmarks).toContainEqual(newBookmark)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets loading to true during add', async () => {
      let resolvePromise: (value: Bookmark) => void
      const promise = new Promise<Bookmark>((resolve) => {
        resolvePromise = resolve
      })
      const bookmarkDto = createBookmarkDto()
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'createBookmark').mockReturnValue(promise)

      const addPromise = store.addBookmark(bookmarkDto)
      expect(store.loading).toBe(true)

      resolvePromise!(createBookmark())
      await addPromise

      expect(store.loading).toBe(false)
    })

    it('handles add error and throws', async () => {
      const errorMessage = 'Failed to create bookmark'
      const bookmarkDto = createBookmarkDto()
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'createBookmark').mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(store.addBookmark(bookmarkDto)).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.bookmarks).toEqual([])
    })

    it('handles non-Error exceptions', async () => {
      const bookmarkDto = createBookmarkDto()
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'createBookmark').mockRejectedValue('String error')

      await expect(store.addBookmark(bookmarkDto)).rejects.toBe('String error')

      expect(store.error).toBe('Failed to create bookmark')
    })

    it('clears error before adding', async () => {
      store.error = 'Previous error'
      const newBookmark = createBookmark()
      const bookmarkDto = createBookmarkDto()
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'createBookmark').mockResolvedValue(newBookmark)

      await store.addBookmark(bookmarkDto)

      expect(store.error).toBe(null)
    })
  })

  describe('removeBookmark', () => {
    it('removes bookmark successfully', async () => {
      const bookmark1 = createBookmark({ id: 'id-1' })
      const bookmark2 = createBookmark({ id: 'id-2' })
      store.bookmarks = [bookmark1, bookmark2]

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteBookmark').mockResolvedValue(undefined)

      await store.removeBookmark('id-1')

      expect(store.bookmarks).toHaveLength(1)
      expect(store.bookmarks[0].id).toBe('id-2')
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets loading to true during remove', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]

      let resolvePromise: () => void
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteBookmark').mockReturnValue(promise)

      const removePromise = store.removeBookmark('id-1')
      expect(store.loading).toBe(true)

      resolvePromise!()
      await removePromise

      expect(store.loading).toBe(false)
    })

    it('handles remove error and throws', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]
      const errorMessage = 'Failed to delete bookmark'

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteBookmark').mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(store.removeBookmark('id-1')).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.bookmarks).toHaveLength(1) // Bookmark should not be removed on error
    })

    it('handles non-Error exceptions', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteBookmark').mockRejectedValue('String error')

      await expect(store.removeBookmark('id-1')).rejects.toBe('String error')

      expect(store.error).toBe('Failed to delete bookmark')
    })

    it('clears error before removing', async () => {
      store.error = 'Previous error'
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteBookmark').mockResolvedValue(undefined)

      await store.removeBookmark('id-1')

      expect(store.error).toBe(null)
    })

    it('does not remove bookmark if id does not exist', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteBookmark').mockResolvedValue(undefined)

      await store.removeBookmark('non-existent-id')

      expect(store.bookmarks).toHaveLength(1)
    })
  })
})

