import type { IBookmarkApi, RefreshFaviconsResponse } from './bookmarkApi.interface'
import type { Bookmark, CreateBookmarkDto, UpdateBookmarkDto } from '@/types/bookmark'

/**
 * HTTP implementation of IBookmarkApi for real backend communication
 */
export class HttpBookmarkApi implements IBookmarkApi {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getAllBookmarks(tabId?: string): Promise<Bookmark[]> {
    try {
      const url = tabId ? `${this.baseUrl}/bookmarks?tabId=${tabId}` : `${this.baseUrl}/bookmarks`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpBookmarkApi] Error fetching bookmarks:', error)
      throw error
    }
  }

  async createBookmark(data: CreateBookmarkDto): Promise<Bookmark> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to create bookmark: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpBookmarkApi] Error creating bookmark:', error)
      throw error
    }
  }

  async updateBookmark(id: string, data: UpdateBookmarkDto): Promise<Bookmark> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`Failed to update bookmark: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpBookmarkApi] Error updating bookmark:', error)
      throw error
    }
  }

  async deleteBookmark(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete bookmark: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[HttpBookmarkApi] Error deleting bookmark:', error)
      throw error
    }
  }

  async deleteAllBookmarks(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks/all`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete all bookmarks: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[HttpBookmarkApi] Error deleting all bookmarks:', error)
      throw error
    }
  }

  async refreshAllFavicons(): Promise<RefreshFaviconsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks/refresh-favicons`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(`Failed to refresh favicons: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[HttpBookmarkApi] Error refreshing favicons:', error)
      throw error
    }
  }
}

