import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Bookmark, CreateBookmarkDto, UpdateBookmarkDto } from '@/types/bookmark'
import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'

export const useBookmarkStore = defineStore('bookmark', () => {
  const bookmarks = ref<Bookmark[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const bookmarksCount = computed(() => bookmarks.value.length)

  function getBookmarksByGroup(groupId: string) {
    return bookmarks.value.filter((bookmark) => bookmark.groupIds?.includes(groupId))
  }

  function getUngroupedBookmarks() {
    return bookmarks.value.filter(
      (bookmark) => !bookmark.groupIds || bookmark.groupIds.length === 0
    )
  }

  async function fetchBookmarks() {
    loading.value = true
    error.value = null
    try {
      bookmarks.value = await bookmarkApi.getAllBookmarks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch bookmarks'
      console.error('Error fetching bookmarks:', err)
    } finally {
      loading.value = false
    }
  }

  async function addBookmark(data: CreateBookmarkDto) {
    loading.value = true
    error.value = null
    try {
      const newBookmark = await bookmarkApi.createBookmark(data)
      bookmarks.value.push(newBookmark)
      return newBookmark
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create bookmark'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBookmark(id: string, data: UpdateBookmarkDto) {
    loading.value = true
    error.value = null
    try {
      const updatedBookmark = await bookmarkApi.updateBookmark(id, data)
      const index = bookmarks.value.findIndex((bookmark) => bookmark.id === id)
      if (index !== -1) {
        bookmarks.value[index] = updatedBookmark
      }
      return updatedBookmark
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update bookmark'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeBookmark(id: string) {
    loading.value = true
    error.value = null
    try {
      await bookmarkApi.deleteBookmark(id)
      bookmarks.value = bookmarks.value.filter((bookmark) => bookmark.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete bookmark'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    bookmarks,
    loading,
    error,
    bookmarksCount,
    getBookmarksByGroup,
    getUngroupedBookmarks,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    removeBookmark,
  }
})

