import type { IGroupApi } from './groupApi.interface'
import type { Group, CreateGroupDto, UpdateGroupDto } from '@/types/group'
import type { Bookmark } from '@/types/bookmark'

const STORAGE_KEY_GROUPS = 'groups-mock-data'
const STORAGE_KEY_BOOKMARKS = 'bookmarks-mock-data'

/**
 * Mock implementation of IGroupApi for testing purposes
 * Uses localStorage to persist data across page refreshes
 */
export class MockGroupApi implements IGroupApi {
  private getGroupsStorage(): Group[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY_GROUPS)
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem(STORAGE_KEY_GROUPS)
      return []
    }
  }

  private setGroupsStorage(groups: Group[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups))
  }

  private getBookmarksStorage(): Bookmark[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS)
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem(STORAGE_KEY_BOOKMARKS)
      return []
    }
  }

  private setBookmarksStorage(bookmarks: Bookmark[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks))
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(ms: number = 300): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  async getAllGroups(tabId?: string): Promise<Group[]> {
    console.log('[MockGroupApi] Fetching all groups', tabId ? `for tab ${tabId}` : '')
    await this.simulateDelay()
    const groups = this.getGroupsStorage()
    if (tabId) {
      return groups.filter((group) => group.tabId === tabId)
    }
    return groups
  }

  async createGroup(data: CreateGroupDto): Promise<Group> {
    console.log('[MockGroupApi] Creating group:', data)
    await this.simulateDelay()

    const groups = this.getGroupsStorage()
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color,
      tabId: data.tabId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    groups.push(newGroup)
    this.setGroupsStorage(groups)
    return newGroup
  }

  async updateGroup(id: string, data: UpdateGroupDto): Promise<Group> {
    console.log('[MockGroupApi] Updating group:', id, data)
    await this.simulateDelay()

    const groups = this.getGroupsStorage()
    const groupIndex = groups.findIndex((group) => group.id === id)
    
    if (groupIndex === -1) {
      throw new Error(`Group with id ${id} not found`)
    }

    const updatedGroup: Group = {
      ...groups[groupIndex],
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.tabId !== undefined && { tabId: data.tabId }),
      updatedAt: new Date().toISOString(),
    }
    
    groups[groupIndex] = updatedGroup
    this.setGroupsStorage(groups)
    return updatedGroup
  }

  async deleteGroup(id: string): Promise<void> {
    console.log('[MockGroupApi] Deleting group:', id)
    await this.simulateDelay()

    const groups = this.getGroupsStorage()
    const filtered = groups.filter((group) => group.id !== id)
    this.setGroupsStorage(filtered)

    // Delete all bookmarks that belong to this group
    const bookmarks = this.getBookmarksStorage()
    const remainingBookmarks = bookmarks.filter(
      (bookmark) => !bookmark.groupIds || !bookmark.groupIds.includes(id)
    )
    
    this.setBookmarksStorage(remainingBookmarks)
  }

  async addBookmarkToGroup(groupId: string, bookmarkId: string): Promise<void> {
    console.log('[MockGroupApi] Adding bookmark to group:', bookmarkId, groupId)
    await this.simulateDelay()

    const bookmarks = this.getBookmarksStorage()
    const bookmarkIndex = bookmarks.findIndex((bookmark) => bookmark.id === bookmarkId)
    
    if (bookmarkIndex === -1) {
      throw new Error(`Bookmark with id ${bookmarkId} not found`)
    }

    const bookmark = bookmarks[bookmarkIndex]
    const groupIds = bookmark.groupIds || []
    
    if (!groupIds.includes(groupId)) {
      bookmark.groupIds = [...groupIds, groupId]
      bookmarks[bookmarkIndex] = bookmark
      this.setBookmarksStorage(bookmarks)
    }
  }

  async removeBookmarkFromGroup(groupId: string, bookmarkId: string): Promise<void> {
    console.log('[MockGroupApi] Removing bookmark from group:', bookmarkId, groupId)
    await this.simulateDelay()

    const bookmarks = this.getBookmarksStorage()
    const bookmarkIndex = bookmarks.findIndex((bookmark) => bookmark.id === bookmarkId)
    
    if (bookmarkIndex === -1) {
      throw new Error(`Bookmark with id ${bookmarkId} not found`)
    }

    const bookmark = bookmarks[bookmarkIndex]
    const groupIds = bookmark.groupIds || []
    
    bookmark.groupIds = groupIds.filter((id) => id !== groupId)
    bookmarks[bookmarkIndex] = bookmark
    this.setBookmarksStorage(bookmarks)
  }

  async deleteAllGroups(): Promise<void> {
    console.log('[MockGroupApi] Deleting all groups')
    await this.simulateDelay()
    this.setGroupsStorage([])
  }

  /**
   * Clear all mock data (useful for testing)
   */
  clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_GROUPS)
    }
  }
}

