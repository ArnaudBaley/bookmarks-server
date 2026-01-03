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
    return stored ? JSON.parse(stored) : []
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

  async getAllBookmarks(): Promise<Bookmark[]> {
    console.log('[MockBookmarkApi] Fetching all bookmarks')
    await this.simulateDelay()
    return this.getStorage()
  }

  async createBookmark(data: CreateBookmarkDto): Promise<Bookmark> {
    console.log('[MockBookmarkApi] Creating bookmark:', data)
    await this.simulateDelay()

    const bookmarks = this.getStorage()
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      name: data.name,
      url: data.url,
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

    const updatedBookmark: Bookmark = {
      ...bookmarks[bookmarkIndex],
      name: data.name,
      url: data.url,
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

  /**
   * Clear all mock data (useful for testing)
   */
  clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

