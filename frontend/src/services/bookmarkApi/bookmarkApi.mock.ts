import type { IBookmarkApi } from './bookmarkApi.interface'
import type { Bookmark, CreateBookmarkDto, UpdateBookmarkDto } from '@/types/bookmark'

const STORAGE_KEY = 'bookmarks-mock-data'

/**
 * Mock implementation of IBookmarkApi for testing purposes
 * Uses localStorage to persist data across page refreshes
 */
export class MockBookmarkApi implements IBookmarkApi {
  private getStorage(): Bookmark[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch {
      // If JSON is corrupted, clear it and return empty array
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
  }

  private setStorage(bookmarks: Bookmark[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(ms: number = 300): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getAllBookmarks(tabId?: string): Promise<Bookmark[]> {
    console.log('[MockBookmarkApi] Fetching all bookmarks', tabId ? `for tab ${tabId}` : '')
    await this.simulateDelay()
    const bookmarks = this.getStorage()
    if (tabId) {
      return bookmarks.filter((bookmark) => 
        bookmark.tabId === tabId || bookmark.tabIds?.includes(tabId)
      )
    }
    return bookmarks
  }

  async createBookmark(data: CreateBookmarkDto): Promise<Bookmark> {
    console.log('[MockBookmarkApi] Creating bookmark:', data)
    await this.simulateDelay()

    const bookmarks = this.getStorage()
    // Support both tabIds (new) and tabId (backward compatibility)
    const tabIds = data.tabIds || (data.tabId ? [data.tabId] : [])
    const tabId = data.tabId || (tabIds.length > 0 ? tabIds[0] : undefined)
    
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      name: data.name,
      url: data.url,
      tabId,
      tabIds: tabIds.length > 0 ? tabIds : undefined,
      groupIds: data.groupIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    bookmarks.push(newBookmark)
    this.setStorage(bookmarks)
    return newBookmark
  }

  async updateBookmark(id: string, data: UpdateBookmarkDto): Promise<Bookmark> {
    console.log('[MockBookmarkApi] Updating bookmark:', id, data)
    await this.simulateDelay()

    const bookmarks = this.getStorage()
    const bookmarkIndex = bookmarks.findIndex((bookmark) => bookmark.id === id)
    
    if (bookmarkIndex === -1) {
      throw new Error(`Bookmark with id ${id} not found`)
    }

    // Handle tabIds (new) or tabId (backward compatibility)
    let tabId: string | undefined
    let tabIds: string[] | undefined
    
    if (data.tabIds !== undefined) {
      tabIds = data.tabIds.length > 0 ? data.tabIds : undefined
      tabId = tabIds && tabIds.length > 0 ? tabIds[0] : undefined
    } else if (data.tabId !== undefined) {
      tabId = data.tabId
      tabIds = data.tabId ? [data.tabId] : undefined
    }

    const updatedBookmark: Bookmark = {
      ...bookmarks[bookmarkIndex],
      ...(data.name !== undefined && { name: data.name }),
      ...(data.url !== undefined && { url: data.url }),
      ...(tabId !== undefined && { tabId }),
      ...(tabIds !== undefined && { tabIds }),
      groupIds: data.groupIds !== undefined ? data.groupIds : bookmarks[bookmarkIndex].groupIds,
      updatedAt: new Date().toISOString(),
    }
    
    bookmarks[bookmarkIndex] = updatedBookmark
    this.setStorage(bookmarks)
    return updatedBookmark
  }

  async deleteBookmark(id: string): Promise<void> {
    console.log('[MockBookmarkApi] Deleting bookmark:', id)
    await this.simulateDelay()

    const bookmarks = this.getStorage()
    const filtered = bookmarks.filter((bookmark) => bookmark.id !== id)
    this.setStorage(filtered)
  }

  async deleteAllBookmarks(): Promise<void> {
    console.log('[MockBookmarkApi] Deleting all bookmarks')
    await this.simulateDelay()
    this.setStorage([])
  }

  /**
   * Clear all mock data (useful for testing)
   */
  clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

