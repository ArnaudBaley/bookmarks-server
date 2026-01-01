import type { IBookmarkApi } from './bookmarkApi.interface'
import type { CreateBookmarkDto } from '@/types/bookmark'
import { MockBookmarkApi } from './bookmarkApi.mock'
import { HttpBookmarkApi } from './bookmarkApi.http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

/**
 * Factory function to create the appropriate bookmark API implementation
 * @returns An instance of IBookmarkApi (either MockBookmarkApi or HttpBookmarkApi)
 */
function createBookmarkApi(): IBookmarkApi {
  // Force mock mode if explicitly set
  if (USE_MOCK_API) {
    console.log('[BookmarkApi] Using MockBookmarkApi (forced by VITE_USE_MOCK_API)')
    return new MockBookmarkApi()
  }

  // Use mock if no API URL is configured
  if (!import.meta.env.VITE_API_BASE_URL) {
    console.log('[BookmarkApi] Using MockBookmarkApi (no VITE_API_BASE_URL configured)')
    return new MockBookmarkApi()
  }

  // Use HTTP API with fallback to mock on errors
  console.log(`[BookmarkApi] Using HttpBookmarkApi with base URL: ${API_BASE_URL}`)
  return new HttpBookmarkApiWithFallback(API_BASE_URL)
}

/**
 * Wrapper that falls back to mock API if HTTP API fails
 * This provides a seamless experience during development
 */
class HttpBookmarkApiWithFallback implements IBookmarkApi {
  private httpApi: HttpBookmarkApi
  private mockApi: MockBookmarkApi

  constructor(baseUrl: string) {
    this.httpApi = new HttpBookmarkApi(baseUrl)
    this.mockApi = new MockBookmarkApi()
  }

  async getAllBookmarks() {
    try {
      return await this.httpApi.getAllBookmarks()
    } catch (error) {
      console.warn('[BookmarkApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.getAllBookmarks()
    }
  }

  async createBookmark(data: CreateBookmarkDto) {
    try {
      return await this.httpApi.createBookmark(data)
    } catch (error) {
      console.warn('[BookmarkApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.createBookmark(data)
    }
  }

  async deleteBookmark(id: string) {
    try {
      return await this.httpApi.deleteBookmark(id)
    } catch (error) {
      console.warn('[BookmarkApi] HTTP API failed, falling back to mock API', error)
      return this.mockApi.deleteBookmark(id)
    }
  }
}

// Export the singleton instance
export const bookmarkApi: IBookmarkApi = createBookmarkApi()

// Export types and implementations for testing
export { MockBookmarkApi, HttpBookmarkApi }
export type { IBookmarkApi }
