import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpTabApi } from './tabApi.http'
import { createTab, createTabArray, createTabDto } from '@/test-utils'

describe('HttpTabApi', () => {
  const baseUrl = 'http://localhost:3000'
  let api: HttpTabApi

  beforeEach(() => {
    api = new HttpTabApi(baseUrl)
    vi.clearAllMocks()
  })

  describe('getAllTabs', () => {
    it('fetches all tabs successfully', async () => {
      const mockTabs = createTabArray(2)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue(mockTabs),
      })

      const result = await api.getAllTabs()

      expect(result).toEqual(mockTabs)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/tabs`)
    })

    it('throws error when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.getAllTabs()).rejects.toThrow('Failed to fetch tabs: Internal Server Error')
    })

    it('throws error when fetch fails', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.getAllTabs()).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpTabApi] Error fetching tabs:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('getTabById', () => {
    it('fetches tab by id successfully', async () => {
      const mockTab = createTab({ id: 'tab-1' })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue(mockTab),
      })

      const result = await api.getTabById('tab-1')

      expect(result).toEqual(mockTab)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/tabs/tab-1`)
    })

    it('throws error when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.getTabById('tab-1')).rejects.toThrow('Failed to fetch tab: Not Found')
    })

    it('throws error when fetch fails', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.getTabById('tab-1')).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpTabApi] Error fetching tab:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('createTab', () => {
    it('creates tab successfully', async () => {
      const tabDto = createTabDto({ name: 'New Tab', color: '#ef4444' })
      const createdTab = createTab({ name: 'New Tab', color: '#ef4444' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        json: vi.fn().mockResolvedValue(createdTab),
      })

      const result = await api.createTab(tabDto)

      expect(result).toEqual(createdTab)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/tabs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tabDto),
      })
    })

    it('throws error when response is not ok', async () => {
      const tabDto = createTabDto()
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.createTab(tabDto)).rejects.toThrow('Failed to create tab: Bad Request')
    })

    it('throws error when fetch fails', async () => {
      const tabDto = createTabDto()
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.createTab(tabDto)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpTabApi] Error creating tab:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('updateTab', () => {
    it('updates tab successfully', async () => {
      const tabId = 'test-tab-id'
      const updateDto = createTabDto({ name: 'Updated Tab', color: '#10b981' })
      const updatedTab = createTab({ id: tabId, name: 'Updated Tab', color: '#10b981' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue(updatedTab),
      })

      const result = await api.updateTab(tabId, updateDto)

      expect(result).toEqual(updatedTab)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/tabs/${tabId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateDto),
      })
    })

    it('throws error when response is not ok', async () => {
      const tabId = 'test-tab-id'
      const updateDto = createTabDto()
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.updateTab(tabId, updateDto)).rejects.toThrow('Failed to update tab: Not Found')
    })

    it('throws error when fetch fails', async () => {
      const tabId = 'test-tab-id'
      const updateDto = createTabDto()
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.updateTab(tabId, updateDto)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpTabApi] Error updating tab:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('deleteTab', () => {
    it('deletes tab successfully', async () => {
      const tabId = 'test-tab-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      await api.deleteTab(tabId)

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/tabs/${tabId}`, {
        method: 'DELETE',
      })
    })

    it('throws error when response is not ok', async () => {
      const tabId = 'test-tab-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(api.deleteTab(tabId)).rejects.toThrow('Failed to delete tab: Not Found')
    })

    it('extracts error message from response body when available', async () => {
      const tabId = 'test-tab-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ message: 'Custom error message' }),
      })

      await expect(api.deleteTab(tabId)).rejects.toThrow('Custom error message')
    })

    it('uses statusText when response body is not JSON', async () => {
      const tabId = 'test-tab-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockRejectedValue(new Error('Not JSON')),
      })

      await expect(api.deleteTab(tabId)).rejects.toThrow('Failed to delete tab: Not Found')
    })

    it('throws error when fetch fails', async () => {
      const tabId = 'test-tab-id'
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.deleteTab(tabId)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpTabApi] Error deleting tab:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Base URL handling', () => {
    it('uses provided base URL in constructor', async () => {
      const customBaseUrl = 'https://api.example.com'
      const customApi = new HttpTabApi(customBaseUrl)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })

      await customApi.getAllTabs()

      expect(global.fetch).toHaveBeenCalledWith(`${customBaseUrl}/tabs`)
    })
  })
})

