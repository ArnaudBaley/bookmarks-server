import type { IBookmarkApi } from './bookmarkApi.interface'
import type { CreateBookmarkDto, UpdateBookmarkDto } from '@/types/bookmark'
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

  // Use HTTP API directly - errors will propagate to stores for proper error handling
  console.log(`[BookmarkApi] Using HttpBookmarkApi with base URL: ${API_BASE_URL}`)
  return new HttpBookmarkApi(API_BASE_URL)
}

// Export the singleton instance
export const bookmarkApi: IBookmarkApi = createBookmarkApi()

// Export types and implementations for testing
export { MockBookmarkApi, HttpBookmarkApi }
export type { IBookmarkApi }
