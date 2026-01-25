import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Group, CreateGroupDto, UpdateGroupDto } from '@/types/group'
import { groupApi } from '@/services/groupApi/groupApi'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useTabStore } from '@/stores/tab/tab'

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Group[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const groupsCount = computed(() => groups.value.length)

  const getGroupById = computed(() => {
    return (id: string) => groups.value.find((group) => group.id === id)
  })

  const filteredGroups = computed(() => {
    const tabStore = useTabStore()
    if (!tabStore.activeTabId) return []
    return groups.value
      .filter((group) => group.tabId === tabStore.activeTabId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  })

  async function fetchGroups() {
    loading.value = true
    error.value = null
    try {
      const tabStore = useTabStore()
      groups.value = await groupApi.getAllGroups(tabStore.activeTabId || undefined)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch groups'
      console.error('Error fetching groups:', err)
    } finally {
      loading.value = false
    }
  }

  async function addGroup(data: CreateGroupDto) {
    loading.value = true
    error.value = null
    try {
      const newGroup = await groupApi.createGroup(data)
      groups.value.push(newGroup)
      return newGroup
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create group'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateGroup(id: string, data: UpdateGroupDto) {
    loading.value = true
    error.value = null
    try {
      const updatedGroup = await groupApi.updateGroup(id, data)
      const index = groups.value.findIndex((group) => group.id === id)
      if (index !== -1) {
        groups.value[index] = updatedGroup
      }
      return updatedGroup
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update group'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeGroup(id: string) {
    loading.value = true
    error.value = null
    try {
      await groupApi.deleteGroup(id)
      groups.value = groups.value.filter((group) => group.id !== id)
      
      // Also remove bookmarks that were in this group
      const bookmarkStore = useBookmarkStore()
      bookmarkStore.bookmarks = bookmarkStore.bookmarks.filter(
        (bookmark) => !bookmark.groupIds || !bookmark.groupIds.includes(id)
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete group'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addBookmarkToGroup(groupId: string, bookmarkId: string) {
    loading.value = true
    error.value = null
    try {
      await groupApi.addBookmarkToGroup(groupId, bookmarkId)
      
      // Update bookmark in store
      const bookmarkStore = useBookmarkStore()
      const bookmark = bookmarkStore.bookmarks.find((b) => b.id === bookmarkId)
      if (bookmark) {
        const groupIds = bookmark.groupIds || []
        if (!groupIds.includes(groupId)) {
          bookmark.groupIds = [...groupIds, groupId]
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add bookmark to group'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeBookmarkFromGroup(groupId: string, bookmarkId: string) {
    loading.value = true
    error.value = null
    try {
      await groupApi.removeBookmarkFromGroup(groupId, bookmarkId)
      
      // Update bookmark in store
      const bookmarkStore = useBookmarkStore()
      const bookmark = bookmarkStore.bookmarks.find((b) => b.id === bookmarkId)
      if (bookmark && bookmark.groupIds) {
        bookmark.groupIds = bookmark.groupIds.filter((id) => id !== groupId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove bookmark from group'
      throw err
    } finally {
      loading.value = false
    }
  }

  function getBookmarksByGroup(groupId: string) {
    const bookmarkStore = useBookmarkStore()
    return bookmarkStore.filteredBookmarks
      .filter((bookmark) => bookmark.groupIds?.includes(groupId))
      .sort((a, b) => {
        const orderA = a.groupOrderIndexes?.[groupId] ?? 0
        const orderB = b.groupOrderIndexes?.[groupId] ?? 0
        return orderA - orderB
      })
  }

  function getUngroupedBookmarks() {
    const bookmarkStore = useBookmarkStore()
    return bookmarkStore.filteredBookmarks.filter(
      (bookmark) => !bookmark.groupIds || bookmark.groupIds.length === 0
    )
  }

  async function deleteAllGroups() {
    loading.value = true
    error.value = null
    try {
      await groupApi.deleteAllGroups()
      groups.value = []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete all groups'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function moveGroupUp(groupId: string) {
    const sorted = filteredGroups.value
    const index = sorted.findIndex((g) => g.id === groupId)
    if (index <= 0) return // Already at top or not found

    const targetGroup = sorted[index - 1]
    const newOrderIndex = targetGroup.orderIndex

    loading.value = true
    error.value = null
    try {
      await groupApi.reorderGroup(groupId, newOrderIndex)
      // Refetch all groups to get updated orderIndex values
      await fetchGroups()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to move group up'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function moveGroupDown(groupId: string) {
    const sorted = filteredGroups.value
    const index = sorted.findIndex((g) => g.id === groupId)
    if (index < 0 || index >= sorted.length - 1) return // Already at bottom or not found

    const targetGroup = sorted[index + 1]
    const newOrderIndex = targetGroup.orderIndex

    loading.value = true
    error.value = null
    try {
      await groupApi.reorderGroup(groupId, newOrderIndex)
      // Refetch all groups to get updated orderIndex values
      await fetchGroups()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to move group down'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function reorderGroupToIndex(groupId: string, targetIndex: number) {
    const sorted = filteredGroups.value
    const currentIndex = sorted.findIndex((g) => g.id === groupId)
    if (currentIndex === -1 || currentIndex === targetIndex) return

    // Calculate the new orderIndex based on target position
    let newOrderIndex: number
    if (sorted.length === 0) {
      newOrderIndex = 0
    } else if (targetIndex <= 0) {
      // Moving to the beginning
      newOrderIndex = (sorted[0]?.orderIndex ?? 0) - 1
    } else if (targetIndex >= sorted.length) {
      // Moving to the end
      newOrderIndex = (sorted[sorted.length - 1]?.orderIndex ?? 0) + 1
    } else if (targetIndex > currentIndex) {
      // Moving down - use the orderIndex of the target position
      newOrderIndex = sorted[targetIndex]?.orderIndex ?? 0
    } else {
      // Moving up - use the orderIndex of the target position
      newOrderIndex = sorted[targetIndex]?.orderIndex ?? 0
    }

    loading.value = true
    error.value = null
    try {
      await groupApi.reorderGroup(groupId, newOrderIndex)
      // Refetch all groups to get updated orderIndex values
      await fetchGroups()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder group'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reorder a bookmark within a group to a specific position
   */
  async function reorderBookmarkInGroup(
    groupId: string,
    bookmarkId: string,
    bookmarks: { id: string }[],
    targetIndex: number,
  ) {
    console.log('reorderBookmarkInGroup called:', { groupId, bookmarkId, targetIndex, bookmarksLength: bookmarks.length })
    
    // Find current index of the bookmark in the list
    const currentIndex = bookmarks.findIndex((b) => b.id === bookmarkId)
    console.log('currentIndex:', currentIndex)
    
    if (currentIndex === -1) {
      console.log('Bookmark not found in list')
      return
    }
    
    if (currentIndex === targetIndex) {
      console.log('Same position, no reorder needed')
      return
    }
    
    // Also skip if dropping right after the current position (no actual move)
    if (targetIndex === currentIndex + 1) {
      console.log('Dropping immediately after current position, no reorder needed')
      return
    }

    // Calculate the new orderIndex based on the target position
    // When moving down, we need to subtract 1 because after removing the item,
    // all subsequent items shift up
    let newOrderIndex: number
    if (targetIndex === 0) {
      // Moving to the beginning
      newOrderIndex = 0
    } else if (targetIndex >= bookmarks.length) {
      // Moving to the end
      newOrderIndex = bookmarks.length - 1
    } else if (targetIndex > currentIndex) {
      // Moving down - subtract 1 to account for item removal
      newOrderIndex = targetIndex - 1
    } else {
      // Moving up
      newOrderIndex = targetIndex
    }
    
    console.log('Calling API with newOrderIndex:', newOrderIndex)

    loading.value = true
    error.value = null
    try {
      await groupApi.reorderBookmarkInGroup(groupId, bookmarkId, newOrderIndex)
      // Refresh bookmarks to get updated groupOrderIndexes
      const bookmarkStore = useBookmarkStore()
      await bookmarkStore.fetchBookmarks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder bookmark'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    groups,
    filteredGroups,
    loading,
    error,
    groupsCount,
    getGroupById,
    fetchGroups,
    addGroup,
    updateGroup,
    removeGroup,
    addBookmarkToGroup,
    removeBookmarkFromGroup,
    getBookmarksByGroup,
    getUngroupedBookmarks,
    deleteAllGroups,
    moveGroupUp,
    moveGroupDown,
    reorderGroupToIndex,
    reorderBookmarkInGroup,
  }
})

