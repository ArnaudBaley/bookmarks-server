import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpGroupApi } from './groupApi.http'
import { createGroup, createGroupArray, createGroupDto } from '@/test-utils'

describe('HttpGroupApi', () => {
  const baseUrl = 'http://localhost:3000'
  let api: HttpGroupApi

  beforeEach(() => {
    api = new HttpGroupApi(baseUrl)
    vi.clearAllMocks()
  })

  describe('getAllGroups', () => {
    it('fetches all groups successfully', async () => {
      const mockGroups = createGroupArray(2)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue(mockGroups),
      })

      const result = await api.getAllGroups()

      expect(result).toEqual(mockGroups)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/groups`)
    })

    it('throws error when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.getAllGroups()).rejects.toThrow('Failed to fetch groups: Internal Server Error')
    })

    it('throws error when fetch fails', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.getAllGroups()).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpGroupApi] Error fetching groups:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('createGroup', () => {
    it('creates group successfully', async () => {
      const groupDto = createGroupDto({ name: 'New Group', color: '#ef4444' })
      const createdGroup = createGroup({ name: 'New Group', color: '#ef4444' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        json: vi.fn().mockResolvedValue(createdGroup),
      })

      const result = await api.createGroup(groupDto)

      expect(result).toEqual(createdGroup)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupDto),
      })
    })

    it('throws error when response is not ok', async () => {
      const groupDto = createGroupDto()
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.createGroup(groupDto)).rejects.toThrow('Failed to create group: Bad Request')
    })

    it('throws error when fetch fails', async () => {
      const groupDto = createGroupDto()
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.createGroup(groupDto)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpGroupApi] Error creating group:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('updateGroup', () => {
    it('updates group successfully', async () => {
      const groupId = 'test-group-id'
      const updateDto = createGroupDto({ name: 'Updated Group', color: '#10b981' })
      const updatedGroup = createGroup({ id: groupId, name: 'Updated Group', color: '#10b981' })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue(updatedGroup),
      })

      const result = await api.updateGroup(groupId, updateDto)

      expect(result).toEqual(updatedGroup)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateDto),
      })
    })

    it('throws error when response is not ok', async () => {
      const groupId = 'test-group-id'
      const updateDto = createGroupDto()
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(api.updateGroup(groupId, updateDto)).rejects.toThrow('Failed to update group: Not Found')
    })

    it('throws error when fetch fails', async () => {
      const groupId = 'test-group-id'
      const updateDto = createGroupDto()
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.updateGroup(groupId, updateDto)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpGroupApi] Error updating group:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('deleteGroup', () => {
    it('deletes group successfully', async () => {
      const groupId = 'test-group-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      await api.deleteGroup(groupId)

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/groups/${groupId}`, {
        method: 'DELETE',
      })
    })

    it('throws error when response is not ok', async () => {
      const groupId = 'test-group-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(api.deleteGroup(groupId)).rejects.toThrow('Failed to delete group: Not Found')
    })

    it('throws error when fetch fails', async () => {
      const groupId = 'test-group-id'
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.deleteGroup(groupId)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpGroupApi] Error deleting group:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('addBookmarkToGroup', () => {
    it('adds bookmark to group successfully', async () => {
      const groupId = 'test-group-id'
      const bookmarkId = 'test-bookmark-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      await api.addBookmarkToGroup(groupId, bookmarkId)

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/groups/${groupId}/bookmarks/${bookmarkId}`,
        {
          method: 'POST',
        }
      )
    })

    it('throws error when response is not ok', async () => {
      const groupId = 'test-group-id'
      const bookmarkId = 'test-bookmark-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(api.addBookmarkToGroup(groupId, bookmarkId)).rejects.toThrow(
        'Failed to add bookmark to group: Not Found'
      )
    })

    it('throws error when fetch fails', async () => {
      const groupId = 'test-group-id'
      const bookmarkId = 'test-bookmark-id'
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.addBookmarkToGroup(groupId, bookmarkId)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpGroupApi] Error adding bookmark to group:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('removeBookmarkFromGroup', () => {
    it('removes bookmark from group successfully', async () => {
      const groupId = 'test-group-id'
      const bookmarkId = 'test-bookmark-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      })

      await api.removeBookmarkFromGroup(groupId, bookmarkId)

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/groups/${groupId}/bookmarks/${bookmarkId}`,
        {
          method: 'DELETE',
        }
      )
    })

    it('throws error when response is not ok', async () => {
      const groupId = 'test-group-id'
      const bookmarkId = 'test-bookmark-id'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(api.removeBookmarkFromGroup(groupId, bookmarkId)).rejects.toThrow(
        'Failed to remove bookmark from group: Not Found'
      )
    })

    it('throws error when fetch fails', async () => {
      const groupId = 'test-group-id'
      const bookmarkId = 'test-bookmark-id'
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.removeBookmarkFromGroup(groupId, bookmarkId)).rejects.toThrow('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HttpGroupApi] Error removing bookmark from group:'),
        networkError
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Base URL handling', () => {
    it('uses provided base URL in constructor', async () => {
      const customBaseUrl = 'https://api.example.com'
      const customApi = new HttpGroupApi(customBaseUrl)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([]),
      })

      await customApi.getAllGroups()

      expect(global.fetch).toHaveBeenCalledWith(`${customBaseUrl}/groups`)
    })
  })
})

