import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia } from '@/test-utils'
import { useGroupStore } from './group'
import { useTabStore } from '@/stores/tab/tab'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { createGroup, createGroupArray, createGroupDto } from '@/test-utils'
import { createTab } from '@/test-utils'
import { createBookmark } from '@/test-utils'
import * as groupApiModule from '@/services/groupApi/groupApi'
import type { Group } from '@/types/group'

describe('Group Store', () => {
  let store: ReturnType<typeof useGroupStore>
  let tabStore: ReturnType<typeof useTabStore>
  let bookmarkStore: ReturnType<typeof useBookmarkStore>

  beforeEach(() => {
    createTestPinia()
    store = useGroupStore()
    tabStore = useTabStore()
    bookmarkStore = useBookmarkStore()
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('has empty groups array', () => {
      expect(store.groups).toEqual([])
    })

    it('has loading set to false', () => {
      expect(store.loading).toBe(false)
    })

    it('has error set to null', () => {
      expect(store.error).toBe(null)
    })
  })

  describe('groupsCount computed', () => {
    it('returns 0 when no groups', () => {
      expect(store.groupsCount).toBe(0)
    })

    it('returns correct count when groups exist', () => {
      store.groups = createGroupArray(3)
      expect(store.groupsCount).toBe(3)
    })

    it('updates when groups are added', () => {
      expect(store.groupsCount).toBe(0)
      store.groups.push(createGroup())
      expect(store.groupsCount).toBe(1)
    })
  })

  describe('getGroupById computed', () => {
    it('returns undefined when group not found', () => {
      store.groups = createGroupArray(2)
      expect(store.getGroupById('non-existent-id')).toBeUndefined()
    })

    it('returns the group when found', () => {
      const groups = createGroupArray(2)
      store.groups = groups
      expect(store.getGroupById(groups[0]!.id)).toEqual(groups[0])
    })
  })

  describe('filteredGroups computed', () => {
    it('returns empty array when no activeTabId', () => {
      const groups = createGroupArray(2)
      store.groups = groups
      tabStore.activeTabId = null

      expect(store.filteredGroups).toEqual([])
    })

    it('returns groups filtered by activeTabId', () => {
      const group1 = createGroup({ id: 'group-1', tabId: 'tab-1' })
      const group2 = createGroup({ id: 'group-2', tabId: 'tab-2' })
      store.groups = [group1, group2]
      tabStore.activeTabId = 'tab-1'

      expect(store.filteredGroups).toEqual([group1])
    })

    it('returns empty array when no groups match activeTabId', () => {
      const group = createGroup({ id: 'group-1', tabId: 'tab-1' })
      store.groups = [group]
      tabStore.activeTabId = 'tab-2'

      expect(store.filteredGroups).toEqual([])
    })
  })

  describe('fetchGroups', () => {
    it('fetches groups successfully', async () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const mockGroups = createGroupArray(2)
      vi.spyOn(groupApiModule.groupApi, 'getAllGroups').mockResolvedValue(mockGroups)

      await store.fetchGroups()

      expect(store.groups).toEqual(mockGroups)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('fetches groups with activeTabId filter', async () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const mockGroups = createGroupArray(2)
      const getAllGroupsSpy = vi
        .spyOn(groupApiModule.groupApi, 'getAllGroups')
        .mockResolvedValue(mockGroups)

      await store.fetchGroups()

      expect(getAllGroupsSpy).toHaveBeenCalledWith('tab-1')
    })

    it('fetches groups without filter when no activeTabId', async () => {
      tabStore.activeTabId = null
      const mockGroups = createGroupArray(2)
      const getAllGroupsSpy = vi
        .spyOn(groupApiModule.groupApi, 'getAllGroups')
        .mockResolvedValue(mockGroups)

      await store.fetchGroups()

      expect(getAllGroupsSpy).toHaveBeenCalledWith(undefined)
    })

    it('sets loading to true during fetch', async () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      let resolvePromise: (value: Group[]) => void
      const promise = new Promise<Group[]>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(groupApiModule.groupApi, 'getAllGroups').mockReturnValue(promise)

      const fetchPromise = store.fetchGroups()
      expect(store.loading).toBe(true)

      resolvePromise!(createGroupArray(1))
      await fetchPromise

      expect(store.loading).toBe(false)
    })

    it('handles fetch error', async () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const errorMessage = 'Failed to fetch groups'
      vi.spyOn(groupApiModule.groupApi, 'getAllGroups').mockRejectedValue(
        new Error(errorMessage)
      )

      await store.fetchGroups()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.groups).toEqual([])
    })

    it('handles non-Error exceptions', async () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      vi.spyOn(groupApiModule.groupApi, 'getAllGroups').mockRejectedValue('String error')

      await store.fetchGroups()

      expect(store.error).toBe('Failed to fetch groups')
      expect(store.loading).toBe(false)
    })

    it('clears error before fetching', async () => {
      store.error = 'Previous error'
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const mockGroups = createGroupArray(1)
      vi.spyOn(groupApiModule.groupApi, 'getAllGroups').mockResolvedValue(mockGroups)

      await store.fetchGroups()

      expect(store.error).toBe(null)
    })
  })

  describe('addGroup', () => {
    it('adds group successfully', async () => {
      const newGroup = createGroup({ id: 'new-id', name: 'New Group' })
      const groupDto = createGroupDto({ name: 'New Group' })

      vi.spyOn(groupApiModule.groupApi, 'createGroup').mockResolvedValue(newGroup)

      const result = await store.addGroup(groupDto)

      expect(result).toEqual(newGroup)
      expect(store.groups).toContainEqual(newGroup)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets loading to true during add', async () => {
      let resolvePromise: (value: Group) => void
      const promise = new Promise<Group>((resolve) => {
        resolvePromise = resolve
      })
      const groupDto = createGroupDto()
      vi.spyOn(groupApiModule.groupApi, 'createGroup').mockReturnValue(promise)

      const addPromise = store.addGroup(groupDto)
      expect(store.loading).toBe(true)

      resolvePromise!(createGroup())
      await addPromise

      expect(store.loading).toBe(false)
    })

    it('handles add error and throws', async () => {
      const errorMessage = 'Failed to create group'
      const groupDto = createGroupDto()
      vi.spyOn(groupApiModule.groupApi, 'createGroup').mockRejectedValue(new Error(errorMessage))

      await expect(store.addGroup(groupDto)).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.groups).toEqual([])
    })

    it('handles non-Error exceptions', async () => {
      const groupDto = createGroupDto()
      vi.spyOn(groupApiModule.groupApi, 'createGroup').mockRejectedValue('String error')

      await expect(store.addGroup(groupDto)).rejects.toBe('String error')

      expect(store.error).toBe('Failed to create group')
    })

    it('clears error before adding', async () => {
      store.error = 'Previous error'
      const newGroup = createGroup()
      const groupDto = createGroupDto()
      vi.spyOn(groupApiModule.groupApi, 'createGroup').mockResolvedValue(newGroup)

      await store.addGroup(groupDto)

      expect(store.error).toBe(null)
    })
  })

  describe('updateGroup', () => {
    it('updates group successfully', async () => {
      const existingGroup = createGroup({ id: 'group-1', name: 'Original Name' })
      store.groups = [existingGroup]
      const updatedGroup = createGroup({ id: 'group-1', name: 'Updated Name' })
      vi.spyOn(groupApiModule.groupApi, 'updateGroup').mockResolvedValue(updatedGroup)

      const result = await store.updateGroup('group-1', { name: 'Updated Name' })

      expect(result).toEqual(updatedGroup)
      expect(store.groups[0]).toEqual(updatedGroup)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('does not update if group not found in store', async () => {
      const updatedGroup = createGroup({ id: 'group-1', name: 'Updated Name' })
      vi.spyOn(groupApiModule.groupApi, 'updateGroup').mockResolvedValue(updatedGroup)

      await store.updateGroup('non-existent-id', { name: 'Updated Name' })

      expect(store.groups).toEqual([])
    })

    it('sets loading to true during update', async () => {
      const existingGroup = createGroup({ id: 'group-1' })
      store.groups = [existingGroup]
      let resolvePromise: (value: Group) => void
      const promise = new Promise<Group>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(groupApiModule.groupApi, 'updateGroup').mockReturnValue(promise)

      const updatePromise = store.updateGroup('group-1', { name: 'Updated' })
      expect(store.loading).toBe(true)

      resolvePromise!(createGroup({ id: 'group-1' }))
      await updatePromise

      expect(store.loading).toBe(false)
    })

    it('handles update error and throws', async () => {
      const existingGroup = createGroup({ id: 'group-1' })
      store.groups = [existingGroup]
      const errorMessage = 'Failed to update group'
      vi.spyOn(groupApiModule.groupApi, 'updateGroup').mockRejectedValue(new Error(errorMessage))

      await expect(store.updateGroup('group-1', { name: 'Updated' })).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
    })

    it('handles non-Error exceptions', async () => {
      const existingGroup = createGroup({ id: 'group-1' })
      store.groups = [existingGroup]
      vi.spyOn(groupApiModule.groupApi, 'updateGroup').mockRejectedValue('String error')

      await expect(store.updateGroup('group-1', { name: 'Updated' })).rejects.toBe('String error')

      expect(store.error).toBe('Failed to update group')
    })

    it('clears error before updating', async () => {
      store.error = 'Previous error'
      const existingGroup = createGroup({ id: 'group-1' })
      store.groups = [existingGroup]
      const updatedGroup = createGroup({ id: 'group-1' })
      vi.spyOn(groupApiModule.groupApi, 'updateGroup').mockResolvedValue(updatedGroup)

      await store.updateGroup('group-1', { name: 'Updated' })

      expect(store.error).toBe(null)
    })
  })

  describe('removeGroup', () => {
    it('removes group successfully', async () => {
      const group1 = createGroup({ id: 'group-1' })
      const group2 = createGroup({ id: 'group-2' })
      store.groups = [group1, group2]

      vi.spyOn(groupApiModule.groupApi, 'deleteGroup').mockResolvedValue(undefined)

      await store.removeGroup('group-1')

      expect(store.groups).toHaveLength(1)
      expect(store.groups[0]!.id).toBe('group-2')
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('removes bookmarks that belong to the group', async () => {
      const group = createGroup({ id: 'group-1' })
      store.groups = [group]
      const bookmark1 = createBookmark({ id: 'bookmark-1', groupIds: ['group-1'] })
      const bookmark2 = createBookmark({ id: 'bookmark-2', groupIds: ['group-2'] })
      bookmarkStore.bookmarks = [bookmark1, bookmark2]

      vi.spyOn(groupApiModule.groupApi, 'deleteGroup').mockResolvedValue(undefined)

      await store.removeGroup('group-1')

      expect(bookmarkStore.bookmarks).toHaveLength(1)
      expect(bookmarkStore.bookmarks[0]!.id).toBe('bookmark-2')
    })

    it('does not remove bookmarks without groupIds', async () => {
      const group = createGroup({ id: 'group-1' })
      store.groups = [group]
      const bookmark = createBookmark({ id: 'bookmark-1' })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'deleteGroup').mockResolvedValue(undefined)

      await store.removeGroup('group-1')

      expect(bookmarkStore.bookmarks).toHaveLength(1)
    })

    it('sets loading to true during remove', async () => {
      const group = createGroup({ id: 'group-1' })
      store.groups = [group]

      let resolvePromise: () => void
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(groupApiModule.groupApi, 'deleteGroup').mockReturnValue(promise)

      const removePromise = store.removeGroup('group-1')
      expect(store.loading).toBe(true)

      resolvePromise!()
      await removePromise

      expect(store.loading).toBe(false)
    })

    it('handles remove error and throws', async () => {
      const group = createGroup({ id: 'group-1' })
      store.groups = [group]
      const errorMessage = 'Failed to delete group'

      vi.spyOn(groupApiModule.groupApi, 'deleteGroup').mockRejectedValue(new Error(errorMessage))

      await expect(store.removeGroup('group-1')).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.groups).toHaveLength(1) // Group should not be removed on error
    })

    it('handles non-Error exceptions', async () => {
      const group = createGroup({ id: 'group-1' })
      store.groups = [group]

      vi.spyOn(groupApiModule.groupApi, 'deleteGroup').mockRejectedValue('String error')

      await expect(store.removeGroup('group-1')).rejects.toBe('String error')

      expect(store.error).toBe('Failed to delete group')
    })

    it('clears error before removing', async () => {
      store.error = 'Previous error'
      const group = createGroup({ id: 'group-1' })
      store.groups = [group]

      vi.spyOn(groupApiModule.groupApi, 'deleteGroup').mockResolvedValue(undefined)

      await store.removeGroup('group-1')

      expect(store.error).toBe(null)
    })
  })

  describe('addBookmarkToGroup', () => {
    it('adds bookmark to group successfully', async () => {
      const bookmark = createBookmark({ id: 'bookmark-1' })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'addBookmarkToGroup').mockResolvedValue(undefined)

      await store.addBookmarkToGroup('group-1', 'bookmark-1')

      expect(bookmark.groupIds).toContain('group-1')
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('does not add duplicate group IDs', async () => {
      const bookmark = createBookmark({ id: 'bookmark-1', groupIds: ['group-1'] })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'addBookmarkToGroup').mockResolvedValue(undefined)

      await store.addBookmarkToGroup('group-1', 'bookmark-1')

      expect(bookmark.groupIds).toEqual(['group-1'])
    })

    it('creates groupIds array if it does not exist', async () => {
      const bookmark = createBookmark({ id: 'bookmark-1' })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'addBookmarkToGroup').mockResolvedValue(undefined)

      await store.addBookmarkToGroup('group-1', 'bookmark-1')

      expect(bookmark.groupIds).toEqual(['group-1'])
    })

    it('handles error and throws', async () => {
      const bookmark = createBookmark({ id: 'bookmark-1' })
      bookmarkStore.bookmarks = [bookmark]
      const errorMessage = 'Failed to add bookmark to group'
      vi.spyOn(groupApiModule.groupApi, 'addBookmarkToGroup').mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(store.addBookmarkToGroup('group-1', 'bookmark-1')).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
    })

    it('clears error before adding', async () => {
      store.error = 'Previous error'
      const bookmark = createBookmark({ id: 'bookmark-1' })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'addBookmarkToGroup').mockResolvedValue(undefined)

      await store.addBookmarkToGroup('group-1', 'bookmark-1')

      expect(store.error).toBe(null)
    })
  })

  describe('removeBookmarkFromGroup', () => {
    it('removes bookmark from group successfully', async () => {
      const bookmark = createBookmark({ id: 'bookmark-1', groupIds: ['group-1', 'group-2'] })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'removeBookmarkFromGroup').mockResolvedValue(undefined)

      await store.removeBookmarkFromGroup('group-1', 'bookmark-1')

      expect(bookmark.groupIds).toEqual(['group-2'])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('handles bookmark without groupIds', async () => {
      const bookmark = createBookmark({ id: 'bookmark-1' })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'removeBookmarkFromGroup').mockResolvedValue(undefined)

      await store.removeBookmarkFromGroup('group-1', 'bookmark-1')

      expect(bookmark.groupIds).toBeUndefined()
    })

    it('handles error and throws', async () => {
      const bookmark = createBookmark({ id: 'bookmark-1', groupIds: ['group-1'] })
      bookmarkStore.bookmarks = [bookmark]
      const errorMessage = 'Failed to remove bookmark from group'
      vi.spyOn(groupApiModule.groupApi, 'removeBookmarkFromGroup').mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(store.removeBookmarkFromGroup('group-1', 'bookmark-1')).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
    })

    it('clears error before removing', async () => {
      store.error = 'Previous error'
      const bookmark = createBookmark({ id: 'bookmark-1', groupIds: ['group-1'] })
      bookmarkStore.bookmarks = [bookmark]

      vi.spyOn(groupApiModule.groupApi, 'removeBookmarkFromGroup').mockResolvedValue(undefined)

      await store.removeBookmarkFromGroup('group-1', 'bookmark-1')

      expect(store.error).toBe(null)
    })
  })

  describe('getBookmarksByGroup', () => {
    it('returns bookmarks that belong to the group', () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const bookmark1 = createBookmark({ id: 'bookmark-1', tabId: 'tab-1', groupIds: ['group-1'] })
      const bookmark2 = createBookmark({ id: 'bookmark-2', tabId: 'tab-1', groupIds: ['group-2'] })
      const bookmark3 = createBookmark({ id: 'bookmark-3', tabId: 'tab-1', groupIds: ['group-1', 'group-2'] })
      bookmarkStore.bookmarks = [bookmark1, bookmark2, bookmark3]

      const result = store.getBookmarksByGroup('group-1')

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(bookmark1)
      expect(result).toContainEqual(bookmark3)
    })

    it('returns empty array when no bookmarks belong to the group', () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const bookmark = createBookmark({ id: 'bookmark-1', tabId: 'tab-1', groupIds: ['group-2'] })
      bookmarkStore.bookmarks = [bookmark]

      const result = store.getBookmarksByGroup('group-1')

      expect(result).toEqual([])
    })
  })

  describe('getUngroupedBookmarks', () => {
    it('returns bookmarks without groupIds', () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const bookmark1 = createBookmark({ id: 'bookmark-1', tabId: 'tab-1' })
      const bookmark2 = createBookmark({ id: 'bookmark-2', tabId: 'tab-1', groupIds: ['group-1'] })
      bookmarkStore.bookmarks = [bookmark1, bookmark2]

      const result = store.getUngroupedBookmarks()

      expect(result).toHaveLength(1)
      expect(result).toContainEqual(bookmark1)
    })

    it('returns bookmarks with empty groupIds array', () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const bookmark1 = createBookmark({ id: 'bookmark-1', tabId: 'tab-1', groupIds: [] })
      const bookmark2 = createBookmark({ id: 'bookmark-2', tabId: 'tab-1', groupIds: ['group-1'] })
      bookmarkStore.bookmarks = [bookmark1, bookmark2]

      const result = store.getUngroupedBookmarks()

      expect(result).toHaveLength(1)
      expect(result).toContainEqual(bookmark1)
    })

    it('returns empty array when all bookmarks are grouped', () => {
      const tab = createTab({ id: 'tab-1' })
      tabStore.tabs = [tab]
      tabStore.activeTabId = 'tab-1'
      const bookmark = createBookmark({ id: 'bookmark-1', tabId: 'tab-1', groupIds: ['group-1'] })
      bookmarkStore.bookmarks = [bookmark]

      const result = store.getUngroupedBookmarks()

      expect(result).toEqual([])
    })
  })
})

