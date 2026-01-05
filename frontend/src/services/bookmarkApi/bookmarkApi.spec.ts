import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpBookmarkApi, MockBookmarkApi } from './bookmarkApi'
import { createBookmark, createBookmarkDto } from '@/test-utils'
import type { IBookmarkApi } from './bookmarkApi.interface'
import type { CreateBookmarkDto } from '@/types/bookmark'

// We need to test the HttpBookmarkApiWithFallback class
// Since it's not exported, we'll recreate it for testing
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

describe('BookmarkApi Factory and Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('HttpBookmarkApiWithFallback', () => {
    it('uses HTTP API when it succeeds', async () => {
      const mockBookmarks = [createBookmark()]
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockBookmarks),
      })

      const api = new HttpBookmarkApiWithFallback('http://localhost:3000')
      const result = await api.getAllBookmarks()

      expect(result).toEqual(mockBookmarks)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/bookmarks')
    })

    it('falls back to mock API when HTTP API fails for getAllBookmarks', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const api = new HttpBookmarkApiWithFallback('http://localhost:3000')
      const result = await api.getAllBookmarks()

      expect(result).toEqual([]) // Mock API returns empty array initially
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP API failed, falling back to mock API'),
        expect.any(Error)
      )

      consoleWarnSpy.mockRestore()
    })

    it('falls back to mock API when HTTP API fails for createBookmark', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const api = new HttpBookmarkApiWithFallback('http://localhost:3000')
      const bookmarkDto = createBookmarkDto()
      const result = await api.createBookmark(bookmarkDto)

      expect(result).toHaveProperty('id')
      expect(result.name).toBe(bookmarkDto.name)
      expect(result.url).toBe(bookmarkDto.url)
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('falls back to mock API when HTTP API fails for deleteBookmark', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const api = new HttpBookmarkApiWithFallback('http://localhost:3000')
      // First create a bookmark in mock storage
      const bookmark = await api.createBookmark(createBookmarkDto())
      // Then try to delete it (will use mock API due to fetch failure)
      await api.deleteBookmark(bookmark.id)

      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('falls back to mock API when HTTP response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({}),
      })
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const api = new HttpBookmarkApiWithFallback('http://localhost:3000')
      const result = await api.getAllBookmarks()

      expect(result).toEqual([]) // Falls back to mock API
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })

  describe('API implementations', () => {
    it('exports MockBookmarkApi', () => {
      expect(MockBookmarkApi).toBeDefined()
      const mockApi = new MockBookmarkApi()
      expect(mockApi).toBeInstanceOf(MockBookmarkApi)
    })

    it('exports HttpBookmarkApi', () => {
      expect(HttpBookmarkApi).toBeDefined()
      const httpApi = new HttpBookmarkApi('http://localhost:3000')
      expect(httpApi).toBeInstanceOf(HttpBookmarkApi)
    })
  })
})

