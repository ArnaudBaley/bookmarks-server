import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Group, CreateGroupDto, UpdateGroupDto } from '@/types/group'
import { groupApi } from '@/services/groupApi/groupApi'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Group[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const groupsCount = computed(() => groups.value.length)

  const getGroupById = computed(() => {
    return (id: string) => groups.value.find((group) => group.id === id)
  })

  async function fetchGroups() {
    loading.value = true
    error.value = null
    try {
      groups.value = await groupApi.getAllGroups()
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
    return bookmarkStore.bookmarks.filter(
      (bookmark) => bookmark.groupIds?.includes(groupId)
    )
  }

  function getUngroupedBookmarks() {
    const bookmarkStore = useBookmarkStore()
    return bookmarkStore.bookmarks.filter(
      (bookmark) => !bookmark.groupIds || bookmark.groupIds.length === 0
    )
  }

  return {
    groups,
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
  }
})

