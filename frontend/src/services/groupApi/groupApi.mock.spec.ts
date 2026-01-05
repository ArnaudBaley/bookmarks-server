import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockGroupApi } from './groupApi.mock'
import { createGroupDto, createBookmark } from '@/test-utils'

describe('MockGroupApi', () => {
  let api: MockGroupApi

  beforeEach(() => {
    api = new MockGroupApi()
    api.clearStorage()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('getAllGroups', () => {
    it('returns empty array when no groups exist', async () => {
      const result = await api.getAllGroups()
      expect(result).toEqual([])
    })

    it('returns stored groups', async () => {
      await api.createGroup(createGroupDto({ name: 'Group 1' }))
      await api.createGroup(createGroupDto({ name: 'Group 2' }))

      const result = await api.getAllGroups()

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(expect.objectContaining({ name: 'Group 1' }))
      expect(result).toContainEqual(expect.objectContaining({ name: 'Group 2' }))
    })

    it('simulates network delay', async () => {
      const startTime = Date.now()
      await api.getAllGroups()
      const endTime = Date.now()

      // Should take at least 200ms (delay is 300ms by default)
      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })

    it('persists data in localStorage', async () => {
      await api.createGroup(createGroupDto({ name: 'Persisted Group' }))

      // Create new instance to verify persistence
      const newApi = new MockGroupApi()
      const result = await newApi.getAllGroups()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Persisted Group')
    })
  })

  describe('createGroup', () => {
    it('creates group with generated ID', async () => {
      const groupDto = createGroupDto({ name: 'New Group', color: '#ef4444' })
      const result = await api.createGroup(groupDto)

      expect(result.id).toBeDefined()
      expect(result.name).toBe('New Group')
      expect(result.color).toBe('#ef4444')
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('adds createdAt and updatedAt timestamps', async () => {
      const groupDto = createGroupDto()
      const result = await api.createGroup(groupDto)

      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(new Date(result.createdAt!).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('stores group in localStorage', async () => {
      const groupDto = createGroupDto({ name: 'Stored Group' })
      const createdGroup = await api.createGroup(groupDto)

      const allGroups = await api.getAllGroups()
      expect(allGroups).toContainEqual(createdGroup)
    })

    it('generates unique IDs for multiple groups', async () => {
      const group1 = await api.createGroup(createGroupDto({ name: 'Group 1' }))
      const group2 = await api.createGroup(createGroupDto({ name: 'Group 2' }))

      expect(group1.id).not.toBe(group2.id)
    })

    it('simulates network delay', async () => {
      const startTime = Date.now()
      await api.createGroup(createGroupDto())
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })
  })

  describe('updateGroup', () => {
    it('updates group successfully', async () => {
      const createdGroup = await api.createGroup(createGroupDto({ name: 'Original Name' }))
      const updateDto = createGroupDto({ name: 'Updated Name', color: '#10b981' })

      const updatedGroup = await api.updateGroup(createdGroup.id, updateDto)

      expect(updatedGroup.name).toBe('Updated Name')
      expect(updatedGroup.color).toBe('#10b981')
      expect(updatedGroup.id).toBe(createdGroup.id)
      expect(updatedGroup.updatedAt).toBeDefined()
      expect(new Date(updatedGroup.updatedAt!).getTime()).toBeGreaterThanOrEqual(
        new Date(createdGroup.updatedAt!).getTime()
      )
    })

    it('throws error if group not found', async () => {
      const updateDto = createGroupDto()

      await expect(api.updateGroup('non-existent-id', updateDto)).rejects.toThrow(
        'Group with id non-existent-id not found'
      )
    })

    it('persists update in localStorage', async () => {
      const createdGroup = await api.createGroup(createGroupDto({ name: 'Original' }))
      await api.updateGroup(createdGroup.id, createGroupDto({ name: 'Updated' }))

      const newApi = new MockGroupApi()
      const allGroups = await newApi.getAllGroups()
      const updatedGroup = allGroups.find((g) => g.id === createdGroup.id)

      expect(updatedGroup?.name).toBe('Updated')
    })
  })

  describe('deleteGroup', () => {
    it('removes group by ID', async () => {
      const group1 = await api.createGroup(createGroupDto({ name: 'Group 1' }))
      const group2 = await api.createGroup(createGroupDto({ name: 'Group 2' }))

      await api.deleteGroup(group1.id)

      const allGroups = await api.getAllGroups()
      expect(allGroups).toHaveLength(1)
      expect(allGroups[0].id).toBe(group2.id)
    })

    it('does nothing if group ID does not exist', async () => {
      await api.createGroup(createGroupDto({ name: 'Test Group' }))

      await api.deleteGroup('non-existent-id')

      const allGroups = await api.getAllGroups()
      expect(allGroups).toHaveLength(1)
    })

    it('deletes bookmarks that belong to the group', async () => {
      // Note: This test requires access to bookmark storage
      // Since MockGroupApi manages both groups and bookmarks, we test this integration
      const group = await api.createGroup(createGroupDto({ name: 'Test Group' }))

      // Manually add a bookmark to localStorage that belongs to this group
      const bookmark = createBookmark({ groupIds: [group.id] })
      const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      existingBookmarks.push(bookmark)
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(existingBookmarks))

      await api.deleteGroup(group.id)

      const remainingBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      expect(remainingBookmarks).not.toContainEqual(expect.objectContaining({ id: bookmark.id }))
    })

    it('persists deletion in localStorage', async () => {
      const group = await api.createGroup(createGroupDto({ name: 'To Delete' }))
      await api.deleteGroup(group.id)

      const newApi = new MockGroupApi()
      const allGroups = await newApi.getAllGroups()
      expect(allGroups).not.toContainEqual(expect.objectContaining({ id: group.id }))
    })

    it('simulates network delay', async () => {
      const group = await api.createGroup(createGroupDto())
      const startTime = Date.now()
      await api.deleteGroup(group.id)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })
  })

  describe('addBookmarkToGroup', () => {
    it('adds bookmark to group successfully', async () => {
      const bookmark = createBookmark()
      const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      existingBookmarks.push(bookmark)
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(existingBookmarks))

      const group = await api.createGroup(createGroupDto({ name: 'Test Group' }))

      await api.addBookmarkToGroup(group.id, bookmark.id)

      const updatedBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      const updatedBookmark = updatedBookmarks.find((b: { id: string }) => b.id === bookmark.id)
      expect(updatedBookmark.groupIds).toContain(group.id)
    })

    it('does not add duplicate group IDs', async () => {
      const bookmark = createBookmark({ groupIds: ['existing-group-id'] })
      const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      existingBookmarks.push(bookmark)
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(existingBookmarks))

      await api.addBookmarkToGroup('existing-group-id', bookmark.id)

      const updatedBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      const updatedBookmark = updatedBookmarks.find((b: { id: string }) => b.id === bookmark.id)
      expect(updatedBookmark.groupIds.filter((id: string) => id === 'existing-group-id')).toHaveLength(1)
    })

    it('throws error if bookmark not found', async () => {
      const group = await api.createGroup(createGroupDto())

      await expect(api.addBookmarkToGroup(group.id, 'non-existent-bookmark-id')).rejects.toThrow(
        'Bookmark with id non-existent-bookmark-id not found'
      )
    })
  })

  describe('removeBookmarkFromGroup', () => {
    it('removes bookmark from group successfully', async () => {
      const group = await api.createGroup(createGroupDto({ name: 'Test Group' }))
      const bookmark = createBookmark({ groupIds: [group.id, 'other-group-id'] })
      const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      existingBookmarks.push(bookmark)
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(existingBookmarks))

      await api.removeBookmarkFromGroup(group.id, bookmark.id)

      const updatedBookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      const updatedBookmark = updatedBookmarks.find((b: { id: string }) => b.id === bookmark.id)
      expect(updatedBookmark.groupIds).not.toContain(group.id)
      expect(updatedBookmark.groupIds).toContain('other-group-id')
    })

    it('throws error if bookmark not found', async () => {
      const group = await api.createGroup(createGroupDto())

      await expect(api.removeBookmarkFromGroup(group.id, 'non-existent-bookmark-id')).rejects.toThrow(
        'Bookmark with id non-existent-bookmark-id not found'
      )
    })
  })

  describe('clearStorage', () => {
    it('clears all stored groups', async () => {
      await api.createGroup(createGroupDto({ name: 'Group 1' }))
      await api.createGroup(createGroupDto({ name: 'Group 2' }))

      api.clearStorage()

      const allGroups = await api.getAllGroups()
      expect(allGroups).toEqual([])
    })

    it('removes data from localStorage', async () => {
      await api.createGroup(createGroupDto({ name: 'Test Group' }))
      expect(localStorage.getItem('groups-mock-data')).toBeTruthy()

      api.clearStorage()

      expect(localStorage.getItem('groups-mock-data')).toBeNull()
    })
  })

  describe('localStorage persistence', () => {
    it('persists across API instances', async () => {
      await api.createGroup(createGroupDto({ name: 'Persisted' }))

      const newApi = new MockGroupApi()
      const result = await newApi.getAllGroups()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Persisted')
    })

    it('handles corrupted localStorage data gracefully', async () => {
      localStorage.setItem('groups-mock-data', 'invalid-json')

      const result = await api.getAllGroups()

      expect(result).toEqual([])
      expect(localStorage.getItem('groups-mock-data')).toBeNull()
    })

    it('handles SSR (window undefined)', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR scenario
      global.window = undefined

      const ssrApi = new MockGroupApi()
      expect(() => ssrApi.clearStorage()).not.toThrow()

      global.window = originalWindow
    })
  })
})

