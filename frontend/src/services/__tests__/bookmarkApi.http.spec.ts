import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpBookmarkApi } from '../bookmarkApi.http'
import { createBookmark, createBookmarkDto, createBookmarkArray } from '@/test-utils'

describe('HttpBookmarkApi', () => {
  const baseUrl = 'http://localhost:3000'
  let api: HttpBookmarkApi

  beforeEach(() => {
    api = new HttpBookmarkApi(baseUrl)
    vi.clearAllMocks()
  })

  describe('getAllBookmarks', () => {
    it('fetches all bookmarks successfully', async () => {
      const mockBookmarks = createBookmarkArray(2)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue(mockBookmarks),
      })

      const result = await api.getAllBookmarks()

      expect(result).toEqual(mockBookmarks)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/bookmarks`)
    })

    it('throws error when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.getAllBookmarks()).rejects.toThrow('Failed to fetch bookmarks: Internal Server Error')
    })

    it('throws error when fetch fails', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.getAllBookmarks()).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpBookmarkApi] Error fetching bookmarks:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })

    it('uses correct endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })

      await api.getAllBookmarks()

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/bookmarks`)
    })
  })

  describe('createBookmark', () => {
    it('creates bookmark successfully', async () => {
      const bookmarkDto = createBookmarkDto({ name: 'New Bookmark', url: 'https://example.com' })
      const createdBookmark = createBookmark({ name: 'New Bookmark', url: 'https://example.com' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        json: vi.fn().mockResolvedValue(createdBookmark),
      })

      const result = await api.createBookmark(bookmarkDto)

      expect(result).toEqual(createdBookmark)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarkDto),
      })
    })

    it('throws error when response is not ok', async () => {
      const bookmarkDto = createBookmarkDto()
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.createBookmark(bookmarkDto)).rejects.toThrow('Failed to create bookmark: Bad Request')
    })

    it('throws error when fetch fails', async () => {
      const bookmarkDto = createBookmarkDto()
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.createBookmark(bookmarkDto)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpBookmarkApi] Error creating bookmark:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })

    it('sends correct request body', async () => {
      const bookmarkDto = createBookmarkDto({ name: 'Test', url: 'https://test.com' })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue(createBookmark()),
      })

      await api.createBookmark(bookmarkDto)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(bookmarkDto),
        })
      )
    })

    it('sets correct Content-Type header', async () => {
      const bookmarkDto = createBookmarkDto()
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue(createBookmark()),
      })

      await api.createBookmark(bookmarkDto)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })
  })

  describe('deleteBookmark', () => {
    it('deletes bookmark successfully', async () => {
      const bookmarkId = 'test-id-123'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      await api.deleteBookmark(bookmarkId)

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      })
    })

    it('throws error when response is not ok', async () => {
      const bookmarkId = 'test-id-123'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(api.deleteBookmark(bookmarkId)).rejects.toThrow('Failed to delete bookmark: Not Found')
    })

    it('throws error when fetch fails', async () => {
      const bookmarkId = 'test-id-123'
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.deleteBookmark(bookmarkId)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpBookmarkApi] Error deleting bookmark:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })

    it('uses correct endpoint with bookmark ID', async () => {
      const bookmarkId = 'test-id-456'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })

      await api.deleteBookmark(bookmarkId)

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      })
    })
  })

  describe('Base URL handling', () => {
    it('uses provided base URL in constructor', async () => {
      const customBaseUrl = 'https://api.example.com'
      const customApi = new HttpBookmarkApi(customBaseUrl)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })

      await customApi.getAllBookmarks()

      expect(global.fetch).toHaveBeenCalledWith(`${customBaseUrl}/bookmarks`)
    })
  })
})

