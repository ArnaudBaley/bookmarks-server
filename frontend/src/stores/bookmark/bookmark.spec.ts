import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia } from '@/test-utils'
import { useBookmarkStore } from './bookmark'
import { useTabStore } from '@/stores/tab/tab'
import { createBookmark, createBookmarkArray, createBookmarkDto } from '@/test-utils'
import * as bookmarkApiModule from '@/services/bookmarkApi/bookmarkApi'
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

  describe('filteredBookmarks', () => {
    it('returns empty array when no active tab', () => {
      const tabStore = useTabStore()
      tabStore.activeTabId = null

      store.bookmarks = createBookmarkArray(3)

      expect(store.filteredBookmarks).toEqual([])
    })

    it('filters bookmarks by tabId', () => {
      const tabStore = useTabStore()
      tabStore.activeTabId = 'active-tab-id'

      const bookmark1 = createBookmark({ id: 'id-1', tabId: 'active-tab-id' })
      const bookmark2 = createBookmark({ id: 'id-2', tabId: 'other-tab-id' })
      store.bookmarks = [bookmark1, bookmark2]

      expect(store.filteredBookmarks).toHaveLength(1)
      expect(store.filteredBookmarks[0].id).toBe('id-1')
    })

    it('filters bookmarks by tabIds array', () => {
      const tabStore = useTabStore()
      tabStore.activeTabId = 'active-tab-id'

      const bookmark1 = createBookmark({ id: 'id-1', tabIds: ['active-tab-id', 'other-tab'] })
      const bookmark2 = createBookmark({ id: 'id-2', tabIds: ['other-tab'] })
      store.bookmarks = [bookmark1, bookmark2]

      expect(store.filteredBookmarks).toHaveLength(1)
      expect(store.filteredBookmarks[0].id).toBe('id-1')
    })
  })

  describe('getBookmarksByGroup', () => {
    it('returns bookmarks for a specific group', () => {
      const tabStore = useTabStore()
      tabStore.activeTabId = 'active-tab-id'

      const bookmark1 = createBookmark({ id: 'id-1', tabId: 'active-tab-id', groupIds: ['group-1', 'group-2'] })
      const bookmark2 = createBookmark({ id: 'id-2', tabId: 'active-tab-id', groupIds: ['group-2'] })
      const bookmark3 = createBookmark({ id: 'id-3', tabId: 'active-tab-id', groupIds: ['group-3'] })
      store.bookmarks = [bookmark1, bookmark2, bookmark3]

      const result = store.getBookmarksByGroup('group-2')

      expect(result).toHaveLength(2)
      expect(result.map((b) => b.id)).toEqual(['id-1', 'id-2'])
    })

    it('returns empty array when no bookmarks in group', () => {
      const tabStore = useTabStore()
      tabStore.activeTabId = 'active-tab-id'

      const bookmark = createBookmark({ id: 'id-1', tabId: 'active-tab-id', groupIds: ['group-1'] })
      store.bookmarks = [bookmark]

      const result = store.getBookmarksByGroup('group-2')

      expect(result).toEqual([])
    })
  })

  describe('getUngroupedBookmarks', () => {
    it('returns bookmarks without groupIds', () => {
      const tabStore = useTabStore()
      tabStore.activeTabId = 'active-tab-id'

      const bookmark1 = createBookmark({ id: 'id-1', tabId: 'active-tab-id' })
      const bookmark2 = createBookmark({ id: 'id-2', tabId: 'active-tab-id', groupIds: ['group-1'] })
      const bookmark3 = createBookmark({ id: 'id-3', tabId: 'active-tab-id', groupIds: [] })
      store.bookmarks = [bookmark1, bookmark2, bookmark3]

      const result = store.getUngroupedBookmarks()

      expect(result).toHaveLength(2)
      expect(result.map((b) => b.id)).toEqual(['id-1', 'id-3'])
    })

    it('returns empty array when all bookmarks are grouped', () => {
      const tabStore = useTabStore()
      tabStore.activeTabId = 'active-tab-id'

      const bookmark = createBookmark({ id: 'id-1', tabId: 'active-tab-id', groupIds: ['group-1'] })
      store.bookmarks = [bookmark]

      const result = store.getUngroupedBookmarks()

      expect(result).toEqual([])
    })
  })

  describe('updateBookmark', () => {
    it('updates bookmark successfully', async () => {
      const bookmark = createBookmark({ id: 'id-1', name: 'Original Name' })
      store.bookmarks = [bookmark]

      const updatedBookmark = createBookmark({ id: 'id-1', name: 'Updated Name' })
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'updateBookmark').mockResolvedValue(updatedBookmark)

      const result = await store.updateBookmark('id-1', { name: 'Updated Name' })

      expect(result).toEqual(updatedBookmark)
      expect(store.bookmarks[0].name).toBe('Updated Name')
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets loading to true during update', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]

      let resolvePromise: (value: Bookmark) => void
      const promise = new Promise<Bookmark>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'updateBookmark').mockReturnValue(promise)

      const updatePromise = store.updateBookmark('id-1', { name: 'Updated' })
      expect(store.loading).toBe(true)

      resolvePromise!(createBookmark({ id: 'id-1', name: 'Updated' }))
      await updatePromise

      expect(store.loading).toBe(false)
    })

    it('handles update error and throws', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]
      const errorMessage = 'Failed to update bookmark'

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'updateBookmark').mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(store.updateBookmark('id-1', { name: 'Updated' })).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.bookmarks[0].name).toBe('Test Bookmark') // Should not be updated
    })

    it('handles non-Error exceptions', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'updateBookmark').mockRejectedValue('String error')

      await expect(store.updateBookmark('id-1', { name: 'Updated' })).rejects.toBe('String error')

      expect(store.error).toBe('Failed to update bookmark')
    })

    it('clears error before updating', async () => {
      store.error = 'Previous error'
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]
      const updatedBookmark = createBookmark({ id: 'id-1', name: 'Updated' })

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'updateBookmark').mockResolvedValue(updatedBookmark)

      await store.updateBookmark('id-1', { name: 'Updated' })

      expect(store.error).toBe(null)
    })

    it('does not update bookmark if id does not exist', async () => {
      const bookmark = createBookmark({ id: 'id-1' })
      store.bookmarks = [bookmark]
      const updatedBookmark = createBookmark({ id: 'non-existent', name: 'Updated' })

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'updateBookmark').mockResolvedValue(updatedBookmark)

      await store.updateBookmark('non-existent', { name: 'Updated' })

      expect(store.bookmarks).toHaveLength(1)
      expect(store.bookmarks[0].id).toBe('id-1')
    })
  })

  describe('deleteAllBookmarks', () => {
    it('deletes all bookmarks successfully', async () => {
      store.bookmarks = createBookmarkArray(3)

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteAllBookmarks').mockResolvedValue(undefined)

      await store.deleteAllBookmarks()

      expect(store.bookmarks).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets loading to true during delete all', async () => {
      store.bookmarks = createBookmarkArray(2)

      let resolvePromise: () => void
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteAllBookmarks').mockReturnValue(promise)

      const deletePromise = store.deleteAllBookmarks()
      expect(store.loading).toBe(true)

      resolvePromise!()
      await deletePromise

      expect(store.loading).toBe(false)
    })

    it('handles delete all error and throws', async () => {
      store.bookmarks = createBookmarkArray(2)
      const errorMessage = 'Failed to delete all bookmarks'

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteAllBookmarks').mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(store.deleteAllBookmarks()).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.bookmarks).toHaveLength(2) // Should not be deleted on error
    })

    it('handles non-Error exceptions', async () => {
      store.bookmarks = createBookmarkArray(2)

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteAllBookmarks').mockRejectedValue('String error')

      await expect(store.deleteAllBookmarks()).rejects.toBe('String error')

      expect(store.error).toBe('Failed to delete all bookmarks')
    })

    it('clears error before deleting all', async () => {
      store.error = 'Previous error'
      store.bookmarks = createBookmarkArray(2)

      vi.spyOn(bookmarkApiModule.bookmarkApi, 'deleteAllBookmarks').mockResolvedValue(undefined)

      await store.deleteAllBookmarks()

      expect(store.error).toBe(null)
    })
  })
})

